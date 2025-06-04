import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from "./db";
import { storage } from "./storage";
import { insertRadioStationSchema, insertDiscordServerSchema } from "@shared/schema";
import { DiscordBot } from "./discord-bot";

let discordBot: DiscordBot | null = null;
const connectedClients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session middleware with PostgreSQL store
  const pgSession = connectPgSimple(session);
  
  app.use(session({
    store: new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'valkyrion-radio-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session on each request
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days untuk session yang persisten
      sameSite: 'lax' // Allow cross-site requests for OAuth
    },
    name: 'valkyrie.sid', // Custom session name
    proxy: true // Trust proxy for Railway/Replit environment
  }));

  // Import and configure authentication after environment variables are loaded
  let passport: any, requireAuth: any, getUserServerAccess: any;
  try {
    const authModule = await import('./auth');
    passport = authModule.default;
    requireAuth = authModule.requireAuth;
    getUserServerAccess = authModule.getUserServerAccess;
    
    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());
    console.log('Discord authentication system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
  }

  // Initialize Discord bot
  const discordToken = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
  console.log('Discord token available:', !!discordToken);
  if (discordToken) {
    try {
      discordBot = new DiscordBot(discordToken);
      await discordBot.initialize();
    
      // Set up bot event handlers for real-time updates
      discordBot.on('statusUpdate', (status) => {
        broadcastToClients('botStatusUpdate', status);
      });
      
      discordBot.on('serverUpdate', async (server) => {
        console.log(`📡 Broadcasting server update for ${server.id}:`, server.currentStation?.name);
        broadcastToClients('serverUpdate', server);
        
        // Also send updated servers list for full sync
        const updatedServers = await getUpdatedServersData();
        broadcastToClients('serversUpdate', updatedServers);
      });
    } catch (error) {
      console.error('Failed to initialize Discord bot during startup:', error);
      // Don't throw error, just log it so server can still start
    }
  } else {
    console.warn('No Discord token provided. Bot functionality will be limited.');
  }

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    
    ws.on('close', () => {
      connectedClients.delete(ws);
    });
    
    // Send initial data
    sendInitialData(ws);
  });

  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async function sendInitialData(ws: WebSocket) {
    try {
      const [stations, servers, botStatus] = await Promise.all([
        storage.getAllStations(),
        getUpdatedServersData(),
        storage.getBotStatus()
      ]);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'initialData',
          data: { stations, servers, botStatus }
        }));
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async function getUpdatedServersData() {
    try {
      const dbServers = await storage.getAllServers();
      
      if (!discordBot || !discordBot.isOnline()) {
        return dbServers;
      }

      // Update with real-time Discord data
      const updatedServers = await Promise.all(
        dbServers.map(async (server) => {
          const guild = discordBot?.getGuildById(server.id);
          if (guild) {
            // Get current playing status from bot
            const isPlaying = discordBot?.isServerPlaying(server.id) || false;
            const currentStation = discordBot?.getCurrentStationForServer(server.id);
            
            console.log(`Server ${server.name} status:`, { isPlaying, currentStation: currentStation?.name });
            
            // Update database with current member count
            await storage.updateServer(server.id, {
              memberCount: guild.memberCount,
              isConnected: true,
              lastPlaying: isPlaying
            });
            
            return {
              ...server,
              memberCount: guild.memberCount,
              icon: guild.icon,
              isConnected: true,
              isPlaying,
              currentStation
            };
          }
          return {
            ...server,
            isPlaying: false,
            currentStation: null
          };
        })
      );

      return updatedServers;
    } catch (error) {
      console.error('Error updating servers data:', error);
      return await storage.getAllServers();
    }
  }

  // Authentication endpoints - only register if passport is available
  if (passport) {
    // Discord OAuth login route
    app.get('/auth/discord', passport.authenticate('discord', { scope: ['identify', 'guilds'] }));

    app.get('/auth/discord/callback', 
      passport.authenticate('discord', { failureRedirect: '/' }),
      (req, res) => {
        console.log('Discord OAuth callback successful, redirecting to home');
        // Successful authentication, redirect back to landing page
        res.redirect('/');
      }
    );

    app.post('/auth/logout', (req, res) => {
      console.log('Logout request received, session ID:', req.sessionID);
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        
        // Clear the session data
        if (req.session) {
          req.session.destroy((sessionErr) => {
            if (sessionErr) {
              console.error('Session destruction error:', sessionErr);
            }
            // Clear all cookies related to session
            res.clearCookie('connect.sid', { path: '/' });
            res.clearCookie('connect.sid', { path: '/', domain: '.replit.dev' });
            console.log('Session destroyed and cookies cleared');
            res.json({ success: true });
          });
        } else {
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('connect.sid', { path: '/', domain: '.replit.dev' });
          console.log('No session to destroy, cookies cleared');
          res.json({ success: true });
        }
      });
    });

    app.get('/api/user', async (req, res) => {
      console.log('User check - Session ID:', req.sessionID, 'Authenticated:', req.isAuthenticated());
      if (req.isAuthenticated()) {
        const user = req.user as any;
        console.log('User authenticated:', user?.username);
        
        // Fetch fresh Discord data if access token exists
        if (user.accessToken) {
          try {
            const discordResponse = await fetch('https://discord.com/api/users/@me', {
              headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'User-Agent': 'Valkyrion-Bot/1.0'
              }
            });

            if (discordResponse.ok) {
              const discordData = await discordResponse.json();
              // Merge fresh Discord data with stored user data
              const enrichedUser = {
                ...user,
                displayName: discordData.global_name || discordData.display_name || discordData.username,
                discordUsername: discordData.username,
                discordAvatar: discordData.avatar
              };
              res.json({ user: enrichedUser });
              return;
            }
          } catch (error) {
            console.log('Failed to fetch fresh Discord data:', error);
          }
        }
        
        res.json({ user: req.user });
      } else {
        console.log('User not authenticated');
        res.json({ user: null });
      }
    });

    // Refresh user data from Discord API
    app.post('/api/user/refresh-discord', requireAuth, async (req, res) => {
      try {
        const user = req.user as any;
        if (!user.accessToken) {
          return res.status(400).json({ error: 'No Discord access token available' });
        }

        // Fetch latest user data from Discord
        const discordResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'User-Agent': 'Valkyrion-Bot/1.0'
          }
        });

        if (!discordResponse.ok) {
          return res.status(400).json({ error: 'Failed to fetch Discord data' });
        }

        const discordData = await discordResponse.json();
        console.log('Fetched Discord data:', {
          username: discordData.username,
          global_name: discordData.global_name,
          display_name: discordData.display_name
        });

        // Update user with latest Discord info
        const updatedUser = await storage.updateUser(user.id, {
          displayName: discordData.global_name || discordData.display_name || discordData.username,
          discordUsername: discordData.username,
          discordAvatar: discordData.avatar
        });

        res.json({ 
          success: true, 
          user: updatedUser,
          discordData: {
            username: discordData.username,
            global_name: discordData.global_name,
            display_name: discordData.display_name
          }
        });
      } catch (error) {
        console.error('Error refreshing Discord data:', error);
        res.status(500).json({ error: 'Failed to refresh Discord data' });
      }
    });

    app.get('/api/auth/user', (req, res) => {
      if (req.isAuthenticated()) {
        res.json({ user: req.user });
      } else {
        res.json({ user: null });
      }
    });

    if (requireAuth && getUserServerAccess) {
      app.get('/api/auth/servers', requireAuth, async (req, res) => {
        try {
          const userServers = await getUserServerAccess((req.user as any).id);
          const allServers = await storage.getAllServers();
      
          // Filter servers that user has access to
          const accessibleServers = allServers.filter(server => 
            userServers.includes(server.id)
          );
      
          res.json(accessibleServers);
        } catch (error) {
          console.error('Error fetching user servers:', error);
          res.status(500).json({ error: 'Failed to fetch servers' });
        }
      });

      // Get user role in specific server
      app.get('/api/auth/server/:serverId/role', requireAuth, async (req, res) => {
        try {
          const { serverId } = req.params;
          const user = req.user as any;
          
          if (!discordBot || !discordBot.isOnline()) {
            return res.json({ role: 'member' });
          }

          // Get guild from Discord client using public method
          const guild = discordBot.getGuildById(serverId);
          if (!guild) {
            return res.json({ role: 'member' });
          }

          // Check user's highest role in the server
          const member = await guild.members.fetch(user.discordId).catch(() => null);
          if (!member) {
            return res.json({ role: 'member' });
          }

          // Determine role based on permissions
          let role = 'member';
          if (guild.ownerId === user.discordId) {
            role = 'owner';
          } else if (member.permissions.has('Administrator')) {
            role = 'administrator';
          } else if (member.permissions.has('ManageGuild') || member.permissions.has('ManageChannels')) {
            role = 'moderator';
          }

          res.json({ role, serverId });
        } catch (error) {
          console.error('Error fetching user role:', error);
          res.json({ role: 'member' });
        }
      });
    }
  }

  // Get individual server details
  app.get('/api/servers/:serverId', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!discordBot || !discordBot.isOnline()) {
        return res.status(503).json({ message: 'Bot is not online' });
      }

      const guild = discordBot.getGuildById(serverId);
      if (!guild) {
        return res.status(404).json({ message: 'Server not found' });
      }

      const currentStation = discordBot.getCurrentStationForServer(serverId);
      const isPlaying = discordBot.isServerPlaying(serverId);
      const volume = discordBot.getServerVolume(serverId);
      
      res.json({
        id: serverId,
        name: guild.name,
        memberCount: guild.memberCount,
        isConnected: true,
        currentStation,
        isPlaying,
        volume,
        voiceChannelId: null
      });
    } catch (error) {
      console.error('Error fetching server details:', error);
      res.status(500).json({ message: 'Failed to get server details' });
    }
  });

  // Server-specific status endpoint
  app.get('/api/servers/:serverId/status', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!discordBot || !discordBot.isOnline()) {
        return res.json({ 
          isPlaying: false, 
          currentStation: null, 
          volume: 0,
          listeners: 0 
        });
      }

      const currentStation = discordBot.getCurrentStationForServer(serverId);
      const isPlaying = discordBot.isServerPlaying(serverId);
      
      res.json({
        serverId,
        isPlaying,
        currentStation,
        volume: 100, // Default volume
        listeners: currentStation?.listeners || 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get server status' });
    }
  });

  // Server-specific control endpoints
  app.post('/api/servers/:serverId/play', async (req, res) => {
    try {
      const { serverId } = req.params;
      const { stationId } = req.body;
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }

      if (stationId) {
        const station = await storage.getStation(stationId);
        if (station) {
          await discordBot.playStationForServer(serverId, station);
        }
      }
      
      res.json({ message: 'Playback started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start playback' });
    }
  });



  // Check user voice channel status
  app.get('/api/servers/:serverId/voice-status', requireAuth, async (req, res) => {
    try {
      const { serverId } = req.params;
      const user = req.user as any;
      
      if (!discordBot || !discordBot.isOnline()) {
        return res.json({ inVoiceChannel: false, canControl: false, message: 'Bot is not online' });
      }

      const guild = discordBot.getGuildById(serverId);
      if (!guild) {
        return res.json({ inVoiceChannel: false, canControl: false, message: 'Server not found' });
      }

      // Check if user is in a voice channel in this server
      const member = await guild.members.fetch(user.discordId).catch(() => null);
      if (!member) {
        return res.json({ inVoiceChannel: false, canControl: false, message: 'User not found in server' });
      }

      const userVoiceChannel = member.voice.channel;
      const botVoiceChannel = guild.members.me?.voice.channel;

      if (!userVoiceChannel) {
        return res.json({ 
          inVoiceChannel: false, 
          canControl: false, 
          message: 'Anda harus bergabung ke voice channel untuk mengontrol radio' 
        });
      }

      // Check if user is in the same voice channel as bot
      const sameChannel = botVoiceChannel && userVoiceChannel.id === botVoiceChannel.id;
      
      res.json({
        inVoiceChannel: true,
        canControl: sameChannel,
        voiceChannelName: userVoiceChannel.name,
        botChannelName: botVoiceChannel?.name,
        message: sameChannel 
          ? 'Anda dapat mengontrol radio' 
          : `Bergabunglah ke ${botVoiceChannel?.name || 'voice channel bot'} untuk mengontrol radio`
      });
    } catch (error) {
      console.error('Error checking voice status:', error);
      res.json({ inVoiceChannel: false, canControl: false, message: 'Gagal memeriksa status voice channel' });
    }
  });



  // Volume control endpoint
  app.post('/api/bot/volume', async (req, res) => {
    try {
      const { serverId, volume } = req.body;
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      if (volume === undefined || volume < 0 || volume > 200) {
        return res.status(400).json({ message: 'Volume must be between 0 and 200' });
      }
      
      await discordBot.setVolume(volume);
      res.json({ success: true, message: `Volume set to ${volume}%` });
    } catch (error) {
      console.error('Error setting volume:', error);
      res.status(500).json({ message: 'Failed to set volume' });
    }
  });

  // Server-specific stop endpoint
  app.post('/api/servers/:serverId/stop', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      const serverStates = discordBot.getServerStates();
      const serverState = serverStates.find((s: any) => s.guild?.id === serverId);
      
      if (serverState && serverState.player) {
        serverState.player.stop();
        res.json({ success: true, message: 'Playback stopped for server' });
      } else {
        res.status(404).json({ message: 'Server not found or not playing' });
      }
    } catch (error) {
      console.error('Error stopping server:', error);
      res.status(500).json({ message: 'Failed to stop server' });
    }
  });

  // Bot control endpoints
  app.post('/api/bot/start', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.start();
      const status = await storage.updateBotStatus({ isOnline: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot started successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start bot' });
    }
  });

  // Cleanup duplicate messages endpoint
  app.post('/api/bot/cleanup', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      if (!discordBot.isOnline()) {
        return res.status(400).json({ message: 'Discord bot is not online' });
      }
      
      await discordBot.cleanupDuplicateMessages();
      res.json({ message: 'Cleanup completed successfully' });
    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({ message: 'Failed to cleanup messages' });
    }
  });

  // Force cleanup for specific server
  app.post('/api/bot/cleanup/:serverId', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      if (!discordBot.isOnline()) {
        return res.status(400).json({ message: 'Discord bot is not online' });
      }
      
      await discordBot.forceCleanupServer(serverId);
      res.json({ message: `Force cleanup completed for server ${serverId}` });
    } catch (error) {
      console.error('Error during force cleanup:', error);
      res.status(500).json({ message: 'Failed to force cleanup server' });
    }
  });

  app.post('/api/bot/stop', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.stop();
      const status = await storage.updateBotStatus({ isOnline: false, isPlaying: false });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot stopped successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to stop bot' });
    }
  });

  app.post('/api/bot/restart', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.restart();
      const status = await storage.updateBotStatus({ isOnline: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Bot restarted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to restart bot' });
    }
  });

  // Playback control endpoints
  app.post('/api/bot/play', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.play();
      const status = await storage.updateBotStatus({ isPlaying: true });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Playback started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to start playback' });
    }
  });

  app.post('/api/bot/pause', async (req, res) => {
    try {
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.pause();
      const status = await storage.updateBotStatus({ isPlaying: false });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Playback paused' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to pause playback' });
    }
  });

  // Global bot volume endpoint (deprecated - use per-server volume instead)
  app.post('/api/bot/volume', async (req, res) => {
    try {
      const { volume } = req.body;
      if (typeof volume !== 'number' || volume < 0 || volume > 200) {
        return res.status(400).json({ message: 'Volume must be a number between 0 and 200' });
      }
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      // Update all servers to the same volume (legacy behavior)
      const serverStates = discordBot.getServerStates();
      for (const serverState of serverStates) {
        await discordBot.setServerVolume(serverState.guild.id, volume);
      }
      
      const status = await storage.updateBotStatus({ volume });
      broadcastToClients('botStatusUpdate', status);
      
      res.json({ message: 'Volume updated', volume });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update volume' });
    }
  });

  // Station endpoints
  app.get('/api/stations', async (req, res) => {
    try {
      const stations = await storage.getAllStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  app.get('/api/stations/favorites', async (req, res) => {
    try {
      const stations = await storage.getFavoriteStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch favorite stations' });
    }
  });

  app.post('/api/stations', async (req, res) => {
    try {
      const validatedData = insertRadioStationSchema.parse(req.body);
      const station = await storage.createStation(validatedData);
      broadcastToClients('stationAdded', station);
      res.status(201).json(station);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid station data' });
    }
  });

  app.put('/api/stations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const station = await storage.updateStation(id, updates);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      broadcastToClients('stationUpdated', station);
      res.json(station);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update station' });
    }
  });

  app.post('/api/stations/:id/select', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const station = await storage.getStation(id);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      if (!discordBot) {
        return res.status(400).json({ message: 'Discord bot not initialized' });
      }
      
      await discordBot.playStation(station);
      const status = await storage.updateBotStatus({ 
        currentStationId: id, 
        isPlaying: true 
      });
      broadcastToClients('botStatusUpdate', status);
      broadcastToClients('stationSelected', station);
      
      res.json({ message: 'Station selected', station });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to select station' });
    }
  });

  app.post('/api/stations/:id/favorite', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isFavorite } = req.body;
      
      const success = await storage.setStationFavorite(id, isFavorite);
      if (!success) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      const station = await storage.getStation(id);
      broadcastToClients('stationUpdated', station);
      
      res.json({ message: 'Favorite status updated' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update favorite status' });
    }
  });

  app.delete('/api/stations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStation(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      broadcastToClients('stationDeleted', { id });
      res.json({ message: 'Station deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete station' });
    }
  });

  // Server endpoints - Secured
  app.get('/api/servers', requireAuth, async (req, res) => {
    try {
      // Disable cache for real-time data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const user = req.user as any;
      
      // Get servers user has access to
      const userServers = await getUserServerAccess(user.id);
      const allServers = await getUpdatedServersData();
      
      // Filter servers that user has access to
      const accessibleServers = allServers.filter(server => 
        userServers.includes(server.id)
      );
      
      res.json(accessibleServers);
    } catch (error) {
      console.error('Error fetching servers:', error);
      res.status(500).json({ message: 'Failed to fetch servers' });
    }
  });

  // Bot status endpoint
  app.get('/api/bot/status', async (req, res) => {
    try {
      const status = await storage.getBotStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bot status' });
    }
  });

  // Periodic status updates
  setInterval(async () => {
    try {
      const status = await storage.getBotStatus();
      if (status) {
        // Simulate listener count fluctuation
        const newListeners = status.currentListeners + Math.floor(Math.random() * 10) - 5;
        const updatedStatus = await storage.updateBotStatus({
          currentListeners: Math.max(newListeners, 1)
        });
        broadcastToClients('botStatusUpdate', updatedStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, 30000); // Update every 30 seconds

  // Get bot info including avatar
  app.get('/api/bot/info', async (req, res) => {
    try {
      if (discordBot?.isOnline()) {
        const botInfo = discordBot.getBotInfo();
        res.json(botInfo);
      } else {
        res.json({ isOnline: false });
      }
    } catch (error) {
      console.error('Error getting bot info:', error);
      res.status(500).json({ error: 'Failed to get bot info' });
    }
  });

  // Get real-time listener count from Discord voice channels
  app.get('/api/bot/listeners', async (req, res) => {
    try {
      if (discordBot?.isOnline()) {
        console.log('🔍 Getting total listeners...');
        const serverStates = discordBot.getServerStates();
        console.log(`📊 Active server states: ${serverStates.length}`);
        
        const totalListeners = discordBot.getTotalListeners();
        console.log(`👥 API returning total listeners: ${totalListeners}`);
        res.json({ totalListeners });
      } else {
        console.log('⚠️ Bot is offline, returning 0 listeners');
        res.json({ totalListeners: 0 });
      }
    } catch (error) {
      console.error('Error getting listener count:', error);
      res.json({ totalListeners: 0 });
    }
  });

  // Health check endpoint for UptimeRobot monitoring
  app.get('/health', (req, res) => {
    try {
      const isOnline = discordBot?.isOnline() || false;
      const serverCount = discordBot?.getServerCount() || 0;
      
      if (isOnline && serverCount > 0) {
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          bot: 'online',
          servers: serverCount
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          bot: isOnline ? 'online' : 'offline',
          servers: serverCount
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });

  // Session cleanup endpoint
  app.post('/api/auth/cleanup-sessions', requireAuth, async (req, res) => {
    try {
      // Clean up expired sessions from database
      await pool.query('DELETE FROM session WHERE expire < NOW()');
      res.json({ success: true, message: 'Expired sessions cleaned up' });
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      res.status(500).json({ error: 'Failed to cleanup sessions' });
    }
  });

  // Session status endpoint
  app.get('/api/auth/session-status', (req, res) => {
    res.json({
      authenticated: !!req.user,
      sessionId: req.sessionID,
      user: req.user || null,
      sessionAge: req.session?.cookie?.maxAge || 0
    });
  });

  // Public statistics for homepage (no authentication required)
  app.get('/api/public/stats', async (req, res) => {
    try {
      const totalServers = discordBot?.getServerCount() || 0;
      const totalListeners = discordBot?.getTotalListeners() || 0;
      const isOnline = discordBot?.isOnline() || false;
      const totalStations = (await storage.getAllStations()).length;
      
      console.log(`📊 Public stats: ${totalServers} servers, ${totalListeners} listeners, ${totalStations} stations`);
      
      res.json({ 
        totalServers,
        totalListeners,
        isOnline,
        totalStations
      });
    } catch (error) {
      console.error('Error getting public stats:', error);
      res.json({ 
        totalServers: 0,
        totalListeners: 0,
        isOnline: false,
        totalStations: 0
      });
    }
  });

  // Generate bot invite link with comprehensive permissions
  app.get('/api/bot/invite', async (req, res) => {
    try {
      const clientId = process.env.DISCORD_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'Discord client ID not configured' });
      }

      // Calculate comprehensive permissions bitfield
      const permissions = 
        BigInt(1) << BigInt(3) |   // Administrator
        BigInt(1) << BigInt(4) |   // Manage Channels
        BigInt(1) << BigInt(29) |  // Manage Webhooks
        BigInt(1) << BigInt(10) |  // View Channels
        BigInt(1) << BigInt(11) |  // Send Messages
        BigInt(1) << BigInt(38) |  // Send Messages in Threads
        BigInt(1) << BigInt(14) |  // Embed Links
        BigInt(1) << BigInt(16) |  // Read Message History
        BigInt(1) << BigInt(17) |  // Mention Everyone
        BigInt(1) << BigInt(18) |  // Use External Emojis
        BigInt(1) << BigInt(37) |  // Use External Stickers
        BigInt(1) << BigInt(31) |  // Use Application Commands
        BigInt(1) << BigInt(20) |  // Connect
        BigInt(1) << BigInt(21) |  // Speak
        BigInt(1) << BigInt(25) |  // Use Voice Activity
        BigInt(1) << BigInt(8) |   // Priority Speaker
        BigInt(1) << BigInt(32);   // Request to Speak

      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
      
      res.json({ 
        inviteUrl,
        permissions: [
          'Administrator',
          'Manage Webhooks', 
          'View Channels',
          'Send Messages',
          'Send Messages in Threads',
          'Embed Links',
          'Read Message History',
          'Mention @everyone, @here, and All Roles',
          'Use External Emoji',
          'Use External Stickers', 
          'Use Application Commands',
          'Connect',
          'Speak',
          'Use Voice Activity',
          'Priority Speaker',
          'Request to Speak'
        ]
      });
    } catch (error) {
      console.error('Error generating invite link:', error);
      res.status(500).json({ error: 'Failed to generate invite link' });
    }
  });

  // Enhanced analytics endpoint
  app.get('/api/analytics', async (req, res) => {
    try {
      const { range = '7d', serverId } = req.query;
      
      const stations = await storage.getAllStations();
      const servers = await storage.getAllServers();
      
      // Calculate top stations based on listeners and favorites
      const topStations = stations
        .sort((a, b) => (b.listeners + (b.isFavorite ? 100 : 0)) - (a.listeners + (a.isFavorite ? 100 : 0)))
        .slice(0, 10)
        .map(station => ({
          station,
          playCount: station.listeners,
          totalDuration: station.listeners * 300
        }));
      
      // Calculate genre distribution
      const genreMap = new Map();
      stations.forEach(station => {
        const count = genreMap.get(station.genre) || 0;
        genreMap.set(station.genre, count + station.listeners);
      });
      
      const totalListeners = Array.from(genreMap.values()).reduce((sum, count) => sum + count, 0);
      const genreDistribution = Array.from(genreMap.entries()).map(([genre, count]) => ({
        genre,
        count,
        percentage: totalListeners > 0 ? Math.round((count / totalListeners) * 100) : 0
      })).sort((a, b) => b.count - a.count);
      
      // Generate listening trends based on current activity
      const listeningTrends = Array.from({ length: 24 }, (_, hour) => {
        const baseListeners = discordBot ? discordBot.getServerCount() * 3 : 10;
        const hourModifier = Math.sin((hour - 12) * Math.PI / 12) * 0.3 + 1;
        return {
          hour,
          listeners: Math.floor(baseListeners * hourModifier)
        };
      });
      
      // Get server statistics
      const serverStats = servers.map(server => ({
        serverId: server.id,
        serverName: server.name,
        totalTime: Math.floor(Math.random() * 86400),
        activeUsers: Math.floor(Math.random() * 20) + 1
      }));
      
      res.json({
        topStations,
        genreDistribution,
        listeningTrends,
        serverStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Station favorites endpoint
  app.patch('/api/stations/:id/favorite', async (req, res) => {
    try {
      const { id } = req.params;
      const { isFavorite } = req.body;
      
      const updated = await storage.setStationFavorite(parseInt(id), isFavorite);
      
      if (updated) {
        const stations = await storage.getAllStations();
        broadcastToClients('stationsUpdate', stations);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Station not found' });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      res.status(500).json({ error: 'Failed to update favorite' });
    }
  });

  // Per-server volume control endpoints
  app.get('/api/servers/:serverId/volume', async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (discordBot?.isOnline()) {
        const volume = discordBot.getServerVolume(serverId);
        res.json({ volume });
      } else {
        // Fallback to database value
        const server = await storage.getServer(serverId);
        res.json({ volume: server?.volume || 75 });
      }
    } catch (error) {
      console.error('Error getting server volume:', error);
      res.status(500).json({ error: 'Failed to get server volume' });
    }
  });

  app.post('/api/servers/:serverId/volume', async (req, res) => {
    try {
      const { serverId } = req.params;
      const { volume } = req.body;
      
      if (!volume || volume < 0 || volume > 200) {
        return res.status(400).json({ error: 'Volume must be between 0 and 200' });
      }

      if (discordBot?.isOnline()) {
        await discordBot.setServerVolume(serverId, volume);
      }
      
      // Always update database
      await storage.updateServer(serverId, { volume });
      
      broadcastToClients('serverVolumeUpdate', { serverId, volume });
      res.json({ success: true, volume });
    } catch (error) {
      console.error('Error setting server volume:', error);
      res.status(500).json({ error: 'Failed to set server volume' });
    }
  });

  return httpServer;
}
