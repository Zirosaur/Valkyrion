import { Client, GatewayIntentBits, VoiceChannel, ChannelType, SlashCommandBuilder, REST, Routes, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} from '@discordjs/voice';
import { EventEmitter } from 'events';
import { BotErrorHandler } from './error-handler';
import { spawn } from 'child_process';
import { storage } from './storage';
import type { RadioStation } from '@shared/schema';

interface ServerState {
  connection: any;
  player: any;
  currentStation: RadioStation | null;
  voiceChannelId: string;
  controlChannelId: string;
  guild: any;
  isPlaying: boolean;
  volume: number;
  lastActivity: Date;
  listeners: number;
  lastNowPlayingMessage: any | null;
}

export class DiscordBot extends EventEmitter {
  private client: Client;
  private isInitialized = false;
  private serverStates: Map<string, ServerState> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = Date.now();
  private connectionPool: Map<string, any> = new Map();
  private streamQuality: Map<string, number> = new Map();
  private messageUpdateQueue: Map<string, NodeJS.Timeout> = new Map();
  private lastMessageUpdate: Map<string, number> = new Map();

  constructor(private token: string) {
    super();
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
      ]
    });

    this.setupEventHandlers();
    this.setupHeartbeat();
    this.setupHealthCheck();
    this.setupMemoryCleanup();
  }



  private setupHeartbeat() {
    // Heartbeat setiap 30 detik untuk memastikan bot masih aktif
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      if (this.client.readyAt) {
        console.log(`💓 Heartbeat: Bot aktif - ${new Date().toLocaleTimeString('id-ID')}`);
      }
    }, 30000);
  }

  private setupHealthCheck() {
    // Health check setiap 2 menit
    this.healthCheckInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const timeSinceLastHeartbeat = now - this.lastHeartbeat;
        
        // Jika heartbeat terakhir lebih dari 2 menit, restart bot
        if (timeSinceLastHeartbeat > 120000) {
          console.log('⚠️ Bot tidak responsif, memulai restart...');
          await this.restart();
          return;
        }

        // Periksa status koneksi Discord
        if (!this.client.readyAt) {
          console.log('⚠️ Bot tidak terhubung ke Discord, mencoba reconnect...');
          await this.reconnect();
          return;
        }

        // Periksa voice connections dan optimasi stream quality
        await this.checkVoiceConnections();
        await this.optimizeStreamQuality();
        
        console.log(`✅ Health check OK - Bot sehat dan berjalan normal`);
      } catch (error) {
        console.error('❌ Health check error:', error);
        await this.handleHealthCheckError();
      }
    }, 120000); // Setiap 2 menit
  }

  private setupMemoryCleanup() {
    // Memory cleanup setiap 10 menit
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('🧹 Running memory cleanup...');
        
        // Cleanup unused audio resources
        this.serverStates.forEach((state, guildId) => {
          if (!state.isPlaying && Date.now() - state.lastActivity.getTime() > 300000) {
            // Cleanup connections idle lebih dari 5 menit
            try {
              if (state.connection) {
                state.connection.destroy();
              }
              if (state.player) {
                state.player.stop();
              }
              // Remove from server states to prevent memory leak
              this.serverStates.delete(guildId);
            } catch (cleanupError) {
              console.error(`❌ Error cleaning up server ${guildId}:`, cleanupError);
            }
          }
        });

        // Clear unused connection pool
        Array.from(this.connectionPool.entries()).forEach(([key, connection]) => {
          if (!this.serverStates.has(key)) {
            try {
              connection.destroy();
              this.connectionPool.delete(key);
            } catch (poolError) {
              console.error(`❌ Error cleaning pool connection ${key}:`, poolError);
            }
          }
        });

        // Clear message update queue for inactive servers
        this.messageUpdateQueue.forEach((timeout, guildId) => {
          if (!this.serverStates.has(guildId)) {
            clearTimeout(timeout);
            this.messageUpdateQueue.delete(guildId);
          }
        });

        console.log('✅ Memory cleanup completed');
      } catch (error) {
        console.error('❌ Memory cleanup error:', error);
      }
    }, 600000); // Setiap 10 menit
  }

  private async optimizeStreamQuality() {
    Array.from(this.serverStates.entries()).forEach(([guildId, state]) => {
      if (state.isPlaying && state.currentStation) {
        const memberCount = state.guild?.memberCount || 0;
        
        // Adaptive quality berdasarkan jumlah listeners
        let targetQuality = 128; // Default 128kbps
        if (memberCount > 50) targetQuality = 192;
        if (memberCount > 100) targetQuality = 256;
        
        this.streamQuality.set(guildId, targetQuality);
      }
    });
  }

  private async checkVoiceConnections() {
    Array.from(this.serverStates.entries()).forEach(async ([guildId, state]) => {
      if (state.connection && state.connection.state.status === VoiceConnectionStatus.Disconnected) {
        console.log(`🔄 Voice connection terputus untuk guild ${guildId}, mencoba reconnect...`);
        await this.reconnectVoiceChannel(guildId);
      }
    });
  }

  private async reconnectVoiceChannel(guildId: string) {
    try {
      const state = this.serverStates.get(guildId);
      if (!state) return;

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;

      const voiceChannel = guild.channels.cache.get(state.voiceChannelId) as VoiceChannel;
      if (!voiceChannel) return;

      // Reconnect ke voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      state.connection = connection;
      
      // Resume streaming jika ada station aktif
      if (state.currentStation) {
        await this.playStationForServer(guildId, state.currentStation);
      }

      console.log(`✅ Voice connection restored untuk guild ${guild.name}`);
    } catch (error) {
      console.error(`❌ Error reconnecting voice untuk guild ${guildId}:`, error);
    }
  }

  private async reconnect() {
    try {
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.log('❌ Max reconnect attempts reached, restarting bot...');
        await this.restart();
        return;
      }

      console.log(`🔄 Mencoba reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      await this.client.destroy();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      await this.start();
      
      this.reconnectAttempts = 0; // Reset counter on success
      console.log('✅ Reconnect berhasil');
    } catch (error) {
      console.error('❌ Reconnect error:', error);
      setTimeout(() => this.reconnect(), 10000); // Retry after 10 seconds
    }
  }

  private async handleHealthCheckError() {
    console.log('🔄 Handling health check error, attempting recovery...');
    await this.reconnect();
  }

  private async handleClientError(error: Error) {
    console.error('Handling client error:', error);
    if (error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND')) {
      console.log('Network error detected, attempting reconnect...');
      await this.reconnect();
    }
  }

  private setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`🚀 Bot logged in as ${this.client.user?.tag}`);
      console.log(`📡 Bot is in ${this.client.guilds.cache.size} servers`);
      
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
      
      // Update bot presence with dashboard link
      await this.updateBotPresence();
      
      // Register slash commands
      await this.registerSlashCommands();
      
      // Auto-setup radio interface for all guilds
      await this.autoSetupAllGuilds();
      
      // Store guilds in database and log all guilds and their voice channels
      for (const guild of Array.from(this.client.guilds.cache.values())) {
        try {
          // Save or update server in database
          const { storage } = await import('./storage');
          // Update or create server with current member count
          const existingServer = await storage.getServer(guild.id);
          if (existingServer) {
            await storage.updateServer(guild.id, {
              name: guild.name,
              isConnected: true
            });
          } else {
            await storage.createServer({
              id: guild.id,
              name: guild.name,
              isConnected: true,
              voiceChannelId: null
            });
          }
        } catch (error) {
          console.error(`Error saving guild ${guild.name}:`, error instanceof Error ? error.message : String(error));
        }

        const voiceChannels = guild.channels.cache.filter((channel: any) => channel.type === ChannelType.GuildVoice);
        console.log(`Guild: ${guild.name} - Voice channels: ${voiceChannels.size}`);
        voiceChannels.forEach((channel: any) => {
          const memberCount = channel.members ? channel.members.size : 0;
          console.log(`  - ${channel.name} (${memberCount} members)`);
        });
      }
      
      this.isInitialized = true;
      this.emit('statusUpdate', {
        isOnline: true,
        uptime: 0
      });

      // Auto-resume streaming setelah restart
      setTimeout(() => {
        this.autoResumeStreaming();
      }, 3000);
    });

    this.client.on('error', async (error) => {
      console.error('❌ Discord client error:', error);
      this.emit('statusUpdate', {
        isOnline: false
      });
      await this.handleClientError(error);
    });

    this.client.on('disconnect', async (closeEvent) => {
      console.log('⚠️ Bot disconnected from Discord:', closeEvent);
      this.emit('statusUpdate', {
        isOnline: false
      });
      await this.reconnect();
    });

    this.client.on('warn', (warning) => {
      console.warn('⚠️ Discord client warning:', warning);
    });

    this.client.rest.on('rateLimited', (rateLimitInfo) => {
      console.warn('⏳ Rate limited:', rateLimitInfo);
    });

    this.client.on('guildCreate', (guild) => {
      console.log(`Joined guild: ${guild.name}`);
      this.emit('serverUpdate', {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        isConnected: true
      });
    });

    this.client.on('guildDelete', (guild) => {
      console.log(`Left guild: ${guild.name}`);
      this.emit('serverUpdate', {
        id: guild.id,
        isConnected: false
      });
    });

    // Handle slash command interactions
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    // Audio player events are now handled per-server in setupServerPlayerEvents
  }

  async initialize(): Promise<void> {
    try {
      console.log('Attempting to initialize Discord bot...');
      console.log('Token length:', this.token.length);
      await this.client.login(this.token);
      console.log('Discord bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
      console.error('Error details:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Discord bot...');
      
      // Clear intervals
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      
      // Clear all pending message update timeouts
      Array.from(this.messageUpdateQueue.entries()).forEach(([guildId, timeout]) => {
        clearTimeout(timeout);
      });
      this.messageUpdateQueue.clear();
      this.lastMessageUpdate.clear();
      
      // Disconnect all voice connections
      Array.from(this.serverStates.entries()).forEach(([guildId, state]) => {
        if (state.connection) {
          state.connection.destroy();
        }
        if (state.player) {
          state.player.stop();
        }
      });
      
      this.serverStates.clear();
      
      if (this.client.isReady()) {
        await this.client.destroy();
      }
      
      this.isInitialized = false;
      this.emit('statusUpdate', {
        isOnline: false,
        isPlaying: false
      });
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async play(): Promise<void> {
    const currentStation = this.getCurrentStation();
    if (currentStation) {
      await this.playStation(currentStation);
    } else {
      // If no current station, try to find the first available station and play it
      const defaultStation: RadioStation = {
        id: 1,
        name: "Chill Lofi Radio",
        url: "https://streams.ilovemusic.de/iloveradio17.mp3",
        genre: "Lofi Hip Hop",
        quality: "192kbps",
        artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
        isFavorite: true,
        isActive: true,
        listeners: 127
      };
      await this.playStation(defaultStation);
    }
  }

  async pause(): Promise<void> {
    this.audioPlayer.pause();
  }

  async setVolume(volume: number): Promise<void> {
    try {
      const volumePercent = Math.max(0, Math.min(200, Math.round(volume)));
      console.log(`🔊 Setting volume to ${volumePercent}% for all servers`);
      
      // Update volume for all active servers without restarting playback
      Array.from(this.serverStates.entries()).forEach(([guildId, serverState]) => {
        const oldVolume = serverState.volume;
        serverState.volume = volumePercent;
        console.log(`📊 Updated server ${serverState.guild.name} volume from ${oldVolume}% to ${volumePercent}%`);
        
        // If currently playing, only adjust the existing audio player volume
        if (serverState.isPlaying && serverState.player) {
          try {
            // Apply volume directly to the audio player without restarting
            const audioResource = serverState.player.state.resource;
            if (audioResource && audioResource.volume) {
              audioResource.volume.setVolume(volumePercent / 100);
              console.log(`🎚️ Applied volume ${volumePercent}% to ${serverState.currentStation?.name || 'current track'}`);
            }
          } catch (error) {
            console.error(`Failed to adjust volume for server ${guildId}:`, error);
          }
        }
      });
      
      this.emit('statusUpdate', {
        volume: volumePercent
      });
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  async setServerVolume(guildId: string, volume: number): Promise<void> {
    try {
      const volumePercent = Math.max(0, Math.min(200, Math.round(volume)));
      const serverState = this.serverStates.get(guildId);
      
      if (!serverState) {
        console.log(`🔍 Server ${guildId} not found in active states`);
        return;
      }

      const oldVolume = serverState.volume;
      serverState.volume = volumePercent;
      console.log(`🎚️ Updated ${serverState.guild.name} volume: ${oldVolume}% → ${volumePercent}%`);
      
      // If currently playing, adjust the existing audio player volume
      if (serverState.isPlaying && serverState.player) {
        try {
          const audioResource = serverState.player.state.resource;
          if (audioResource && audioResource.volume) {
            audioResource.volume.setVolume(volumePercent / 100);
            console.log(`🔊 Applied ${volumePercent}% volume to ${serverState.currentStation?.name || 'current track'} in ${serverState.guild.name}`);
          }
        } catch (error) {
          console.error(`Failed to adjust volume for server ${guildId}:`, error);
        }
      }

      // Update database with new volume
      const { storage } = await import('./storage');
      await storage.updateServer(guildId, { volume: volumePercent });
      
      this.emit('serverUpdate', {
        serverId: guildId,
        volume: volumePercent
      });
    } catch (error) {
      console.error(`Error setting server volume for ${guildId}:`, error);
      throw error;
    }
  }

  getServerVolume(guildId: string): number {
    const serverState = this.serverStates.get(guildId);
    return serverState?.volume || 75;
  }

  async playStation(station: RadioStation): Promise<void> {
    try {
      this.currentStation = station;
      
      // Find a voice channel to join
      const guild = this.client.guilds.cache.first();
      if (!guild) {
        throw new Error('No guilds available');
      }

      console.log(`Found guild: ${guild.name} with ${guild.channels.cache.size} channels`);

      // First try to find a voice channel with members
      let targetChannel = guild.channels.cache.find(
        (channel): channel is VoiceChannel => 
          channel.type === ChannelType.GuildVoice && channel.members.size > 0
      ) as VoiceChannel;

      // If no channel with members, find any voice channel
      if (!targetChannel) {
        targetChannel = guild.channels.cache.find(
          (channel): channel is VoiceChannel => 
            channel.type === ChannelType.GuildVoice
        ) as VoiceChannel;
      }
      
      if (!targetChannel) {
        throw new Error('No voice channels found in the server');
      }

      console.log(`Attempting to join voice channel: ${targetChannel.name}`);

      // Join voice channel
      this.voiceConnection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      console.log(`Successfully joined voice channel: ${targetChannel.name} in guild: ${guild.name}`);

      // Wait for connection to be ready
      await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30000);
      console.log('Voice connection is ready!');

      // Create audio resource from station URL
      const resource = createAudioResource(station.url, {
        inputType: StreamType.Arbitrary,
      });

      // Initialize audio player if not exists
      if (!this.audioPlayer) {
        this.audioPlayer = createAudioPlayer();
      }
      
      this.audioPlayer.play(resource);
      this.voiceConnection.subscribe(this.audioPlayer);

      console.log(`Now playing: ${station.name}`);
      this.emit('statusUpdate', {
        currentStationId: station.id,
        isPlaying: true
      });

    } catch (error) {
      console.error('Error playing station:', error);
      throw error;
    }
  }

  getConnectedServers() {
    return this.client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      isConnected: true,
      voiceChannelId: null
    }));
  }

  // Public method to get guild by ID for API access
  getGuildById(guildId: string) {
    return this.client.guilds.cache.get(guildId);
  }

  getBotInfo() {
    const user = this.client.user;
    return {
      id: user?.id,
      username: user?.username,
      tag: user?.tag,
      avatar: user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
      isOnline: this.isOnline(),
      serverCount: this.getServerCount()
    };
  }

  isOnline(): boolean {
    return this.client.isReady();
  }

  getCurrentStation(): RadioStation | null {
    return this.currentStation;
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Radio bot commands')
        .addSubcommand(subcommand =>
          subcommand
            .setName('status')
            .setDescription('Check radio bot status and current playing station')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('dashboard')
            .setDescription('Get link to radio dashboard for monitoring')
        ),
        
      new SlashCommandBuilder()
        .setName('stations')
        .setDescription('View available radio stations and how to control them'),
        
      new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup radio channels and interface for this server'),
        
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('How to use Valkyrion Radio Bot')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
      console.log('Mulai refresh slash commands...');
      
      // Register commands globally
      await rest.put(
        Routes.applicationCommands(this.client.user!.id),
        { body: commands }
      );

      console.log('Slash commands berhasil didaftarkan!');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  private async handleSlashCommand(interaction: ChatInputCommandInteraction) {
    try {
      if (!interaction.guild) {
        await interaction.reply({ content: 'Commands ini hanya bisa digunakan di server Discord.', ephemeral: true });
        return;
      }
      if (interaction.commandName === 'radio') {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
          case 'status':
            const status = this.isOnline() ? '🟢 Online' : '🔴 Offline';
            const guildId = interaction.guild!.id;
            const serverState = this.serverStates.get(guildId);
            const currentStation = serverState?.currentStation;
            const isPlaying = serverState?.isPlaying || false;
            const volume = serverState?.volume || 100;
            const voiceChannelId = serverState?.voiceChannelId;
            
            // Get voice channel info
            let voiceChannelInfo = '';
            if (voiceChannelId) {
              const voiceChannel = interaction.guild!.channels.cache.get(voiceChannelId);
              if (voiceChannel) {
                const memberCount = voiceChannel.members?.size || 0;
                voiceChannelInfo = `\n🔊 **Voice Channel:** ${voiceChannel.name} (${memberCount} listeners)`;
              }
            }
            
            // Create beautiful embed-like status
            let statusText = `
╭─────────────────────────────────╮
│           🎵 **RADIO STATUS**           │
╰─────────────────────────────────╯

🤖 **Bot Status:** ${status}
🏰 **Server:** ${interaction.guild!.name}${voiceChannelInfo}
`;

            if (currentStation && isPlaying) {
              const stationEmoji = this.getStationEmoji(currentStation.genre);
              statusText += `
📻 **Currently Playing:**
${stationEmoji} **${currentStation.name}**
🎼 Genre: ${currentStation.genre}
💎 Quality: ${currentStation.quality}
🔊 Volume: ${volume}%

▶️ **Status:** Playing
`;
            } else if (currentStation && !isPlaying) {
              const stationEmoji = this.getStationEmoji(currentStation.genre);
              statusText += `
📻 **Last Station:**
${stationEmoji} **${currentStation.name}**
⏸️ **Status:** Paused/Stopped
`;
            } else {
              statusText += `
📻 **Station:** None
⏹️ **Status:** Not playing

💡 **Quick Start:**
1️⃣ Run \`/setup\` to create radio channels
2️⃣ Join voice channel **📻｜Radio Hub**
3️⃣ Select station in **📻｜radio-control**
`;
            }
            
            await interaction.reply(statusText);
            break;
            
          case 'dashboard':
            const dashboardUrl = process.env.REPLIT_DOMAINS ? 
              `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
              'https://your-dashboard-url.com';
            
            await interaction.reply({
              content: `📊 **Radio Dashboard**\n\nMonitor real-time statistics and radio station info:\n${dashboardUrl}\n\n• Live streaming status\n• Station information\n• Listener statistics\n• Server information`,
              ephemeral: false
            });
            break;
        }
      } else if (interaction.commandName === 'stations') {
        const stationsList = `
🎵 **Available Radio Stations (33+ Total):**

**🎧 Chill & Relaxing:**
• Chill Lofi Radio - Lofi Hip Hop (192kbps)
• Jazz Cafe Radio - Smooth Jazz (128kbps)
• Indie Folk Radio - Indie Folk (128kbps)
• Classical Music - Classical (192kbps)

**🎸 Rock & Alternative:**
• Rock Classic Radio - Classic Rock (192kbps)
• Hard Rock FM - Hard Rock (192kbps)

**🎛️ Electronic & Dance:**
• Electronic Beats - Electronic Dance (192kbps)

**🌏 International:**
• BIG B RADIO #KPOP - Korean Pop
• BIG B RADIO #JPOP - Japanese Pop
• BIG B RADIO #CPOP - Chinese Pop
• BIG B RADIO #APOP - Asian Pop
• Prambors FM - Indonesian Radio
• BBC Radio 1 - UK Pop & Dance

📻 **How to Change Stations:**
1. Run \`/setup\` if you haven't already
2. Go to **📻｜radio-control** channel
3. Use the dropdown menu to select your favorite station
4. Music will start playing in **📻｜Radio Hub** voice channel

💡 **Need Help?** Use \`/help\` for detailed setup instructions
        `;
        await interaction.reply(stationsList);
      } else if (interaction.commandName === 'setup') {
        await this.handleSetupCommand(interaction);
      } else if (interaction.commandName === 'help') {
        const helpText = `
🎵 **Valkyrion Radio Bot - How to Use**

**🚀 First Time Setup:**
1. **IMPORTANT:** Run \`/setup\` command first to create radio channels
2. This creates **📻｜Radio Hub** (voice) and **📻｜radio-control** (text) channels
3. Join the voice channel **📻｜Radio Hub**
4. Open text channel **📻｜radio-control**
5. Select your station from the dropdown menu

**⚡ Available Commands:**
• \`/setup\` - **START HERE** - Creates radio channels for your server
• \`/radio status\` - Check bot status and current playing station
• \`/radio dashboard\` - Get link to web dashboard
• \`/stations\` - View all available radio stations
• \`/help\` - Show this help guide

**🎛️ Radio Controls:**
All radio controls are done through the interactive dropdown menu in **📻｜radio-control** channel. No need to use commands for play/pause/change stations.

**📊 Web Dashboard:**
Access real-time monitoring dashboard with \`/radio dashboard\`

**💡 Need Help?** Join our support server: https://discord.com/invite/valkyrie-758647019396530177
        `;
        await interaction.reply(helpText);
      }
    } catch (error) {
      console.error('Error handling slash command:', error instanceof Error ? error.message : String(error));
      try {
        if (!interaction.replied) {
          await interaction.reply({ content: 'Terjadi error saat menjalankan command.', ephemeral: true });
        }
      } catch (replyError) {
        console.error('Error sending error reply:', replyError instanceof Error ? replyError.message : String(replyError));
      }
    }
  }

  private async getStationByChoice(choice: string): Promise<RadioStation> {
    try {
      // Mapping choice ke nama stasiun atau ID
      const stationMap: Record<string, string | number> = {
        'lofi': 'Chill Lofi Radio',
        'jazz': 'Jazz Cafe Radio',
        'rock': 'Rock Classic Radio',
        'electronic': 'Electronic Beats',
        'indie': 'Indie Folk Radio',
        'classical': 'Classical Music',
        'hardrock': 'Hard Rock FM',
        'pop': 'Pop Hits 24/7',
        'country': 'Country Roads Radio',
        'reggae': 'Reggae Vibes',
        'j1hits': 'J1HITS',
        'j1hd': 'J1HD',
        'kpop': 'BIG B RADIO #KPOP',
        'jpop': 'BIG B RADIO #JPOP',
        'cpop': 'BIG B RADIO #CPOP',
        'apop': 'BIG B RADIO #APOP',
        'prambors': 'Prambors FM',
        'radioindo': 'Radio Indonesia',
        'gen': 'Gen FM',
        'mostfm': 'Most FM',
        'spotify': 'Spotify Hits Radio',
        'chill': 'Chillhop Radio',
        'house': 'Deep House Radio'
      };

      const stationIdentifier = stationMap[choice];
      if (!stationIdentifier) {
        // Fallback ke stasiun pertama jika tidak ditemukan
        const stations = await storage.getAllStations();
        return stations[0] || this.getDefaultStation();
      }

      // Cari berdasarkan nama atau ID
      const stations = await storage.getAllStations();
      const station = stations.find(s => 
        (typeof stationIdentifier === 'string' && s.name === stationIdentifier) ||
        (typeof stationIdentifier === 'number' && s.id === stationIdentifier)
      );

      return station || stations[0] || this.getDefaultStation();
    } catch (error) {
      console.error('Error getting station by choice:', error);
      return this.getDefaultStation();
    }
  }

  private getDefaultStation(): RadioStation {
    return {
      id: 1,
      name: "Chill Lofi Radio",
      url: "https://streams.ilovemusic.de/iloveradio17.mp3",
      genre: "Lofi Hip Hop",
      quality: "192kbps",
      artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
      isFavorite: true,
      isActive: true,
      listeners: 127
    };
  }

  private async handleSetupCommand(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

      const guild = interaction.guild!;
      const guildId = guild.id;

      // Membuat atau mendapatkan voice channel
      const voiceChannel = await this.getOrCreateChannel(guild, '📻｜Radio Hub', ChannelType.GuildVoice);
      const controlChannel = await this.getOrCreateChannel(guild, '📻｜radio-control', ChannelType.GuildText);

      // Cek apakah channel berhasil dibuat/ditemukan
      if (!voiceChannel || !controlChannel) {
        await interaction.editReply(
          `❌ **Setup gagal!**\n\n` +
          `Bot tidak memiliki permission untuk membuat channel yang diperlukan.\n\n` +
          `**Solusi:**\n` +
          `1. Berikan permission "Manage Channels" kepada bot\n` +
          `2. Atau buat channel manual:\n` +
          `   • Voice channel: **📻｜Radio Hub**\n` +
          `   • Text channel: **📻｜radio-control**\n\n` +
          `Setelah itu, jalankan kembali command \`/setup\``
        );
        return;
      }

      // Setup server state
      if (!this.serverStates.has(guildId)) {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        this.serverStates.set(guildId, {
          connection,
          player,
          currentIndex: 0,
          controlChannel: controlChannel.id,
          voiceChannel: voiceChannel.id
        });
      }

      // Setup the full radio interface with dropdowns
      await this.setupRadioInterface(controlChannel, true);

      // Get default station from database
      const allStations = await storage.getAllStations();
      const defaultStation = allStations[0];
      if (defaultStation) {
        await this.playStation(defaultStation);
        await this.updateNowPlayingMessage(controlChannel, defaultStation);
      }

      await interaction.editReply(
        `✅ **Setup berhasil!**\n\n📻 Voice Channel: ${voiceChannel.name}\n🎛️ Control Channel: ${controlChannel.name}\n🎵 Interface lengkap dengan ${allStations.length} stasiun telah dibuat!\n\n🎵 Sekarang memutar: **${defaultStation?.name || 'Tidak ada stasiun'}**`
      );

    } catch (error) {
      console.error('Error in setup command:', error);
      await interaction.editReply('❌ Terjadi kesalahan saat setup. Pastikan bot memiliki permission untuk membuat channel.');
    }
  }

  private async getOrCreateChannel(guild: any, name: string, type: ChannelType): Promise<any> {
    let channel = guild.channels.cache.find((ch: any) => ch.name === name && ch.type === type);
    
    if (!channel) {
      try {
        console.log(`Membuat channel: ${name}`);
        channel = await guild.channels.create({
          name,
          type,
          reason: `Radio bot setup - ${name}`
        });
      } catch (error: any) {
        if (error.code === 50013) {
          console.log(`⚠️  Bot tidak memiliki permission untuk membuat channel "${name}" di server ${guild.name}`);
          console.log(`   Silakan berikan permission "Manage Channels" kepada bot atau buat channel manual`);
          return null;
        }
        throw error;
      }
    } else {
      console.log(`Channel sudah ada: ${name}`);
    }
    
    return channel;
  }

  private async clearMessages(channel: TextChannel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const messageArray = Array.from(messages.values());
      for (const message of messageArray) {
        if (message.deletable) {
          await message.delete().catch(() => {});
        }
      }
    } catch (error) {
      console.log('Could not clear messages:', error);
    }
  }

  private async updateNowPlayingMessage(channel: TextChannel, station: RadioStation) {
    const guildId = channel.guild.id;
    const now = Date.now();
    const lastUpdate = this.lastMessageUpdate.get(guildId) || 0;
    
    // Prevent spam by enforcing minimum 3 second delay between updates
    if (now - lastUpdate < 3000) {
      // Clear existing timeout if any
      const existingTimeout = this.messageUpdateQueue.get(guildId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Schedule update after delay
      const timeout = setTimeout(() => {
        this.doUpdateNowPlayingMessage(channel, station);
        this.messageUpdateQueue.delete(guildId);
      }, 3000 - (now - lastUpdate));
      
      this.messageUpdateQueue.set(guildId, timeout);
      return;
    }
    
    // Update immediately if enough time has passed
    await this.doUpdateNowPlayingMessage(channel, station);
  }

  private async doUpdateNowPlayingMessage(channel: TextChannel, station: RadioStation) {
    const guildId = channel.guild.id;
    const serverState = this.serverStates.get(guildId);
    
    try {
      // First, try to delete ALL existing "now playing" messages to ensure only 1 exists
      if (serverState?.lastNowPlayingMessage) {
        try {
          await serverState.lastNowPlayingMessage.delete();
          console.log(`🗑️ Deleted previous now playing message for ${channel.guild.name}`);
        } catch (error) {
          // Message might have been deleted already, ignore error
          console.log(`⚠️ Could not delete previous message (might be already deleted)`);
        }
        serverState.lastNowPlayingMessage = null;
      }

      // Clean up any other "now playing" messages in the channel (just in case)
      try {
        const messages = await channel.messages.fetch({ limit: 20 });
        let deletedCount = 0;
        for (const message of messages.values()) {
          if (message.author.id === this.client.user?.id && 
              message.embeds.length > 0 && 
              (message.embeds[0].title?.includes('🎵 Sekarang Memutar') ||
               message.embeds[0].title?.includes('🎵 Now Playing'))) {
            await message.delete();
            deletedCount++;
            console.log(`🧹 Cleaned up duplicate now playing message in ${channel.guild.name}`);
          }
        }
        if (deletedCount > 0) {
          console.log(`🧹 Total cleaned up messages: ${deletedCount} in ${channel.guild.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Cleanup error in ${channel.guild.name}:`, error.message);
      }

      const embed = {
        color: 0x5865F2,
        title: '🎵 Sekarang Memutar',
        description: `**${station.name}**`,
        fields: [
          { name: '🎼 Genre', value: station.genre, inline: true },
          { name: '📡 Kualitas', value: station.quality, inline: true },
          { name: '👥 Pendengar', value: `${station.listeners}`, inline: true }
        ],
        thumbnail: station.artwork ? { url: station.artwork } : undefined,
        timestamp: new Date().toISOString()
      };

      // Send new message and store reference
      const newMessage = await channel.send({ embeds: [embed] });
      console.log(`📝 Sent new now playing message: ${station.name} for ${channel.guild.name}`);
      
      if (serverState) {
        serverState.lastNowPlayingMessage = newMessage;
      }
      
      // Update last message time
      this.lastMessageUpdate.set(guildId, Date.now());
    } catch (error) {
      console.error('Error updating now playing message:', error);
    }
  }

  private async sendTemporaryMessage(channel: TextChannel, content: string, duration = 5000) {
    const message = await channel.send(content);
    setTimeout(async () => {
      if (message.deletable) {
        await message.delete().catch(() => {});
      }
    }, duration);
  }

  private async getStationChoices() {
    try {
      const stations = await storage.getAllStations();
      const choices: Record<string, any> = {};
      
      // Mapping stasiun dari database ke choice keys
      const stationKeyMap: Record<string, string> = {
        'Chill Lofi Radio': 'lofi',
        'Jazz Cafe Radio': 'jazz',
        'Rock Classic Radio': 'rock',
        'Electronic Beats': 'electronic',
        'Indie Folk Radio': 'indie',
        'Classical Music': 'classical',
        'Hard Rock FM': 'hardrock',
        'Pop Hits 24/7': 'pop',
        'Country Roads Radio': 'country',
        'Reggae Vibes': 'reggae',
        'J1HITS': 'j1hits',
        'J1HD': 'j1hd',
        'BIG B RADIO #KPOP': 'kpop',
        'BIG B RADIO #JPOP': 'jpop',
        'BIG B RADIO #CPOP': 'cpop',
        'BIG B RADIO #APOP': 'apop',
        'Prambors FM': 'prambors',
        'Radio Indonesia': 'radioindo',
        'Gen FM': 'gen',
        'Most FM': 'mostfm',
        'Spotify Hits Radio': 'spotify',
        'Chillhop Radio': 'chill',
        'Deep House Radio': 'house'
      };

      stations.forEach(station => {
        const key = stationKeyMap[station.name] || station.name.toLowerCase().replace(/\s+/g, '_');
        choices[key] = {
          name: station.name,
          genre: station.genre,
          quality: station.quality
        };
      });

      return choices;
    } catch (error) {
      console.error('Error loading station choices from database:', error);
      // Fallback ke choices minimal
      return {
        'lofi': {
          name: "Chill Lofi Radio",
          genre: "Lofi Hip Hop",
          quality: "192kbps"
        }
      };
    }
  }

  private getStationEmoji(genre: string): string {
    const emojiMap: Record<string, string> = {
      "Lofi Hip Hop": "🎵",
      "Smooth Jazz": "🎷", 
      "Classic Rock": "🎸",
      "Electronic Dance": "🎧",
      "Indie Folk": "🎻",
      "Classical": "🎼",
      "Hard Rock": "🤘",
      "Top 40 Hits": "🎤",
      "Country": "🤠",
      "Reggae": "🌴",
      "Pop Hits": "⭐",
      "Top 40": "🔥",
      "K-Pop": "🇰🇷",
      "J-Pop": "🇯🇵",
      "C-Pop": "🇨🇳",
      "Asian Pop": "🌏",
      "Indonesian Pop": "🇮🇩",
      "Indonesian News & Music": "📻",
      "Indonesian Hits": "🎶",
      "Global Hits": "🌍",
      "Chillhop": "😎",
      "Deep House": "🏠"
    };
    return emojiMap[genre] || "🎵";
  }

  private async autoSetupAllGuilds() {
    console.log('Auto-setting up radio interface for all guilds...');
    
    const guilds = Array.from(this.client.guilds.cache.values());
    for (const guild of guilds) {
      try {
        await this.autoSetupGuild(guild);
      } catch (error) {
        console.error(`Failed to auto-setup guild ${guild.name}:`, error);
      }
    }
  }

  private async autoSetupGuild(guild: any) {
    const guildId = guild.id;

    // Skip if already setup
    if (this.serverStates.has(guildId)) {
      console.log(`Guild ${guild.name} already setup, restoring interface...`);
      await this.restoreInterface(guild);
      return;
    }

    try {
      console.log(`Setting up radio interface for guild: ${guild.name}`);

      // Create or get channels
      const voiceChannel = await this.getOrCreateChannel(guild, '📻｜Radio Hub', ChannelType.GuildVoice);
      const controlChannel = await this.getOrCreateChannel(guild, '📻｜radio-control', ChannelType.GuildText);

      // Skip setup if we can't create required channels
      if (!voiceChannel || !controlChannel) {
        console.log(`⚠️  Skipping auto-setup for ${guild.name} due to missing permissions`);
        return;
      }

      // Setup voice connection and player
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      // Setup player event handlers for this specific server
      this.setupServerPlayerEvents(guildId, player);

      // Load volume from database
      const { storage } = await import('./storage');
      const serverData = await storage.getServer(guildId);
      const serverVolume = serverData?.volume || 75; // Default to 75% if not found

      // Store server state
      this.serverStates.set(guildId, {
        connection,
        player,
        currentStation: null,
        voiceChannelId: voiceChannel.id,
        controlChannelId: controlChannel.id,
        guild: guild,
        isPlaying: false,
        volume: serverVolume,
        lastActivity: new Date(),
        listeners: 0,
        lastNowPlayingMessage: null
      });

      // Setup interface
      await this.setupRadioInterface(controlChannel, true);

      console.log(`Successfully setup radio interface for ${guild.name}`);

      // Emit server update
      this.emit('serverUpdate', {
        id: guildId,
        name: guild.name,
        memberCount: guild.memberCount,
        isConnected: true
      });

    } catch (error) {
      console.error(`Error setting up guild ${guild.name}:`, error);
    }
  }

  private async restoreInterface(guild: any) {
    const guildId = guild.id;
    const state = this.serverStates.get(guildId);
    
    if (!state) return;

    try {
      const controlChannel = guild.channels.cache.get(state.controlChannelId);
      if (controlChannel) {
        await this.setupRadioInterface(controlChannel, false);
        console.log(`Restored interface for ${guild.name}`);
        
        // Auto-resume last playing station if it was playing before restart
        if (state.currentStation && state.isPlaying) {
          console.log(`Auto-resuming last station: ${state.currentStation.name} for ${guild.name}`);
          
          // Reconnect to voice channel and resume playback
          try {
            const voiceChannel = guild.channels.cache.get(state.voiceChannelId);
            if (voiceChannel) {
              // Create new connection
              const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
              });

              // Create new player and subscribe
              const player = createAudioPlayer();
              connection.subscribe(player);
              
              // Update state with new connection and player
              state.connection = connection;
              state.player = player;
              
              // Setup event handlers for the new player
              this.setupServerPlayerEvents(guildId, player);
              
              // Resume the station
              await this.playStationForServer(guildId, state.currentStation);
              
              // Update "Now Playing" message
              await this.updateNowPlayingMessage(controlChannel, state.currentStation);
              
              // Send notification about auto-resume
              await this.sendTemporaryMessage(controlChannel, 
                `🔄 **Auto-Resume**: Melanjutkan ${state.currentStation.name}`, 4000);
            }
          } catch (resumeError) {
            console.error(`Failed to auto-resume for ${guild.name}:`, resumeError);
            // Reset playing state if resume failed
            state.isPlaying = false;
            state.currentStation = null;
          }
        }
      }
    } catch (error) {
      console.error(`Error restoring interface for ${guild.name}:`, error);
    }
  }



  private async setupRadioInterface(controlChannel: TextChannel, clearMessages = true) {
    try {
      // Clear old messages if needed
      if (clearMessages) {
        await this.clearMessages(controlChannel);
      }

      // Get stations from database
      const allStations = await storage.getAllStations();
      console.log(`Found ${allStations.length} stations in database`);

      if (allStations.length === 0) {
        await controlChannel.send(`❌ Tidak ada stasiun radio yang tersedia dalam database.`);
        return;
      }

      // Group stations by category
      const categories: { [key: string]: RadioStation[] } = {
        'Pop & Hits': [],
        'Rock & Metal': [],
        'Electronic & House': [],
        'Chill & Lofi': [],
        'Jazz & Classic': [],
        'World Music': [],
        'Alternative': [],
        'Radio News': []
      };

      // Categorize stations based on genre
      allStations.forEach(station => {
        const genre = station.genre.toLowerCase();
        const name = station.name.toLowerCase();
        
        if (genre.includes('pop') || genre.includes('dance') || genre.includes('hits') || name.includes('pop')) {
          categories['Pop & Hits'].push(station);
        } else if (genre.includes('rock') || genre.includes('metal') || genre.includes('punk') || name.includes('rock')) {
          categories['Rock & Metal'].push(station);
        } else if (genre.includes('electronic') || genre.includes('edm') || genre.includes('house') || genre.includes('techno')) {
          categories['Electronic & House'].push(station);
        } else if (genre.includes('chill') || genre.includes('lofi') || genre.includes('ambient') || name.includes('chill')) {
          categories['Chill & Lofi'].push(station);
        } else if (genre.includes('jazz') || genre.includes('classic') || genre.includes('blues') || name.includes('jazz')) {
          categories['Jazz & Classic'].push(station);
        } else if (genre.includes('alternative') || genre.includes('indie') || genre.includes('reggae')) {
          categories['Alternative'].push(station);
        } else if (genre.includes('news') || genre.includes('talk') || name.includes('news')) {
          categories['Radio News'].push(station);
        } else {
          categories['World Music'].push(station);
        }
      });

      // Create multiple dropdown menus
      const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

      for (const [categoryName, stations] of Object.entries(categories)) {
        if (stations.length > 0) {
          const options = stations.slice(0, 10).map(station => ({ // Max 10 per dropdown
            label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
            value: station.id.toString(),
            description: station.genre.length > 100 ? station.genre.substring(0, 97) + '...' : station.genre
          }));

          if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId(`radio_select_${categoryName.replace(/\s+/g, '_').toLowerCase()}`)
              .setPlaceholder(`${categoryName} (${stations.length} stasiun)`)
              .addOptions(options);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            rows.push(row);
          }
        }
      }

      // If not enough categories, add remaining stations to "Semua Stasiun" category
      const usedStations = new Set();
      Object.values(categories).forEach(categoryStations => {
        categoryStations.forEach(station => usedStations.add(station.id));
      });

      const remainingStations = allStations.filter(station => !usedStations.has(station.id));
      if (remainingStations.length > 0) {
        const options = remainingStations.slice(0, 10).map(station => ({
          label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
          value: station.id.toString(),
          description: station.genre.length > 100 ? station.genre.substring(0, 97) + '...' : station.genre
        }));

        if (options.length > 0) {
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('radio_select_semua_stasiun')
            .setPlaceholder(`Semua Stasiun (${remainingStations.length} stasiun)`)
            .addOptions(options);

          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
          rows.push(row);
        }
      }

      try {

        // Create navigation system with current page
        let currentPageIndex = 0;
        const totalPages = Math.ceil(rows.length / 3); // Show 3 dropdowns per page

        const createPageMessage = (pageIndex: number) => {
          const startIndex = pageIndex * 3;
          const endIndex = Math.min(startIndex + 3, rows.length);
          const pageRows = rows.slice(startIndex, endIndex);

          // Add navigation buttons if needed
          const buttonRow = new ActionRowBuilder<any>();
          
          if (totalPages > 1) {
            if (pageIndex > 0) {
              buttonRow.addComponents(
                new ButtonBuilder()
                  .setCustomId('radio_nav_prev')
                  .setLabel('◀ Sebelumnya')
                  .setStyle(ButtonStyle.Secondary)
              );
            }
            

            
            if (pageIndex < totalPages - 1) {
              buttonRow.addComponents(
                new ButtonBuilder()
                  .setCustomId('radio_nav_next')
                  .setLabel('Selanjutnya ▶')
                  .setStyle(ButtonStyle.Secondary)
              );
            }
          }

          const components = [...pageRows];
          if (buttonRow.components.length > 0) {
            components.push(buttonRow);
          }

          return {
            content: `🎶 **Radio Control - Kategori Musik** 🎶\n\n📻 Voice Channel: 📻｜Radio Hub\n🎵 Pilih kategori dan stasiun radio:\n\n📄 Halaman ${pageIndex + 1} dari ${totalPages}`,
            components
          };
        };

        if (rows.length === 0) {
          await controlChannel.send(`❌ Tidak ada stasiun yang tersedia untuk dikategorikan.`);
          return;
        }

        // Send initial page
        const initialMessage = await controlChannel.send(createPageMessage(currentPageIndex));

        // Setup collectors for all interactions
        const filter = (i: any) => i.customId.startsWith('radio_select_') || i.customId === 'radio_nav_prev' || i.customId === 'radio_nav_next';
        const collector = controlChannel.createMessageComponentCollector({ filter }); // No timeout - interface runs permanently

        collector.on('collect', async (i) => {
          try {
            console.log(`🎛️ Interaction received: ${i.customId} from user ${i.user.tag} in guild ${i.guild?.name}`);
            
            if (i.customId === 'radio_nav_prev' && currentPageIndex > 0) {
              await i.deferUpdate();
              currentPageIndex--;
              await i.editReply(createPageMessage(currentPageIndex));
              console.log(`📄 Navigated to previous page: ${currentPageIndex + 1}`);
              
            } else if (i.customId === 'radio_nav_next' && currentPageIndex < totalPages - 1) {
              await i.deferUpdate();
              currentPageIndex++;
              await i.editReply(createPageMessage(currentPageIndex));
              console.log(`📄 Navigated to next page: ${currentPageIndex + 1}`);

            } else if (i.customId.startsWith('radio_select_')) {
              try {
                await i.deferUpdate();
              } catch (deferError) {
                console.error('❌ Failed to defer interaction, it may have already been responded to:', deferError);
                return;
              }
              
              if (!i.values || i.values.length === 0) {
                console.error('❌ No values in select menu interaction');
                return;
              }
              
              // Check if user is in the same voice channel as the bot
              const member = i.guild?.members.cache.get(i.user.id);
              const userVoiceChannel = member?.voice.channel;
              const botVoiceChannel = i.guild?.members.cache.get(this.client.user?.id || '')?.voice.channel;
              
              console.log(`🔍 Voice channel check for ${i.user.username}:`);
              console.log(`   User channel: ${userVoiceChannel?.name || 'None'} (ID: ${userVoiceChannel?.id || 'None'})`);
              console.log(`   Bot channel: ${botVoiceChannel?.name || 'None'} (ID: ${botVoiceChannel?.id || 'None'})`);
              
              if (!userVoiceChannel) {
                console.log(`❌ User ${i.user.username} not in voice channel, blocking interaction`);
                await this.sendTemporaryMessage(controlChannel, `❌ ${i.user.username}, Anda harus berada di voice channel untuk mengganti stasiun!`);
                return;
              }
              
              if (!botVoiceChannel) {
                console.log(`❌ Bot not in voice channel, blocking interaction`);
                await this.sendTemporaryMessage(controlChannel, `❌ Bot tidak sedang terhubung ke voice channel. Gunakan /setup untuk mengatur ulang.`);
                return;
              }
              
              if (userVoiceChannel.id !== botVoiceChannel.id) {
                console.log(`❌ User ${i.user.username} in wrong channel, blocking interaction`);
                await this.sendTemporaryMessage(controlChannel, `❌ ${i.user.username}, Anda harus berada di channel **${botVoiceChannel.name}** untuk mengganti stasiun!`);
                return;
              }
              
              console.log(`✅ Voice channel validation passed for ${i.user.username}`);
              
              const stationId = parseInt((i as any).values[0]);
              const station = await storage.getStation(stationId);
              
              console.log(`🎵 Station selected: ${station?.name} (ID: ${stationId}) by ${i.user.tag} in voice channel ${userVoiceChannel.name}`);
              
              if (station && i.guild?.id) {
                try {
                  await this.playStationForServer(i.guild.id, station);
                  await this.updateNowPlayingMessage(controlChannel, station);
                  console.log(`✅ Successfully started playing ${station.name} in ${i.guild.name}`);
                } catch (error) {
                  console.error(`❌ Failed to play ${station.name}:`, error instanceof Error ? error.message : String(error));
                  await this.sendTemporaryMessage(controlChannel, `❌ Gagal memutar ${station.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              } else {
                console.error('❌ Station not found or guild ID missing');
                await this.sendTemporaryMessage(controlChannel, '❌ Stasiun tidak ditemukan');
              }
            }
          } catch (error) {
            console.error('❌ Error handling interaction:', error);
            
            // Try to respond to the interaction if it hasn't been responded to yet
            try {
              if (!i.replied && !i.deferred) {
                await i.reply({ content: '❌ Terjadi kesalahan saat memproses permintaan', ephemeral: true });
              }
            } catch (replyError) {
              console.error('Failed to send error response:', replyError);
            }
          }
        });

        // Interface runs permanently - no end handler needed

        console.log(`Radio dropdowns created with ${allStations.length} stations in ${rows.length} categories`);
        
      } catch (error) {
        console.error('Error creating dropdown:', error);
        await controlChannel.send(`❌ Gagal membuat menu kontrol. Gunakan dashboard web atau slash commands.`);
      }

    } catch (error) {
      console.error('Error setting up radio interface:', error);
    }
  }



  private setupServerPlayerEvents(guildId: string, player: any): void {
    player.on(AudioPlayerStatus.Playing, () => {
      console.log(`Audio player started for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = true;
        this.emit('statusUpdate', {
          isPlaying: true,
          currentStation: serverState.currentStation
        });
      }
    });

    player.on(AudioPlayerStatus.Paused, () => {
      console.log(`Audio player paused for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = false;
        this.emit('statusUpdate', { isPlaying: false });
      }
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log(`Audio player idle for server ${guildId}`);
      const serverState = this.serverStates.get(guildId);
      if (serverState) {
        serverState.isPlaying = false;
      }
    });

    player.on('error', (error: any) => {
      console.error(`Audio player error for server ${guildId}:`, error);
    });
  }

  // Multi-server management methods
  async playStationForServer(guildId: string, station: RadioStation): Promise<void> {
    const serverState = this.serverStates.get(guildId);
    if (!serverState) {
      throw new Error(`Server ${guildId} not found`);
    }

    try {
      console.log(`🎵 Playing ${station.name} for server ${guildId}`);
      console.log(`🔗 Stream URL: ${station.url}`);

      // Wait for connection to be ready
      console.log(`⏳ Waiting for voice connection to be ready...`);
      await entersState(serverState.connection, VoiceConnectionStatus.Ready, 30000);
      console.log(`✅ Voice connection ready`);

      // Stop current playback completely
      if (serverState.isPlaying) {
        console.log(`🛑 Stopping current playback`);
        serverState.player.stop(true); // Force stop
        serverState.isPlaying = false;
        
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create audio resource with maximum volume boost
      console.log(`🎧 Creating audio resource with volume boost for ${station.name}...`);
      
      const resource = createAudioResource(station.url, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true, // Enable inline volume for maximum control
        metadata: {
          title: station.name,
          guildId: guildId
        }
      });

      // Apply per-server volume setting
      if (resource.volume) {
        const serverVolume = serverState.volume / 100; // Convert percentage to decimal
        resource.volume.setVolume(serverVolume);
        console.log(`🔊 Applied ${serverState.volume}% volume to ${station.name} for ${serverState.guild.name}`);
      } else {
        console.log(`⚠️ Inline volume not available, using raw stream for ${station.name}`);
      }

      // Add error handling for the resource
      resource.playStream.on('error', (error) => {
        console.error(`❌ Stream error for ${station.name}:`, error);
        serverState.isPlaying = false;
      });

      // Play the audio
      console.log(`▶️ Starting playback...`);
      serverState.player.play(resource);

      serverState.currentStation = station;
      serverState.isPlaying = true;
      serverState.lastActivity = new Date();

      // Simpan stasiun terakhir ke database
      await this.saveLastPlayedStation(guildId, station);

      console.log(`🎶 Now playing: ${station.name}`);

      // Update now playing message in control channel
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const controlChannel = guild.channels.cache.find(
          (ch: any) => ch.name.includes('radio-control') && ch.isTextBased()
        );
        if (controlChannel) {
          await this.updateNowPlayingMessage(controlChannel as any, station);
        }
      }

      // Emit detailed server update for real-time web dashboard
      this.emit('serverUpdate', {
        id: guildId,
        currentStation: station,
        isPlaying: true,
        volume: serverState.volume || 100
      });
      
      this.emit('statusUpdate', {
        currentStation: station,
        isPlaying: true
      });

    } catch (error) {
      console.error(`❌ Error playing station for server ${guildId}:`, error);
      serverState.isPlaying = false;
      throw error;
    }
  }

  getServerStates(): ServerState[] {
    return Array.from(this.serverStates.values());
  }

  getServerCount(): number {
    return this.serverStates.size;
  }

  getTotalListeners(): number {
    let totalListeners = 0;
    
    Array.from(this.serverStates.entries()).forEach(([guildId, state]) => {
      if (state.isPlaying && state.voiceChannelId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (guild) {
          const voiceChannel = guild.channels.cache.get(state.voiceChannelId);
          if (voiceChannel && voiceChannel.isVoiceBased()) {
            // Count all members in voice channel including detailed info
            const allMembers = voiceChannel.members.size;
            const humanMembers = voiceChannel.members.filter(member => !member.user.bot).size;
            const botMembers = voiceChannel.members.filter(member => member.user.bot).size;
            
            console.log(`🎧 ${guild.name}: ${allMembers} total (${humanMembers} humans, ${botMembers} bots) in ${voiceChannel.name}`);
            totalListeners += humanMembers;
          }
        }
      }
    });
    
    console.log(`👥 Total listeners across all servers: ${totalListeners}`);
    return totalListeners;
  }

  getCurrentStationForServer(guildId: string): RadioStation | null {
    const serverState = this.serverStates.get(guildId);
    return serverState ? serverState.currentStation : null;
  }

  isServerPlaying(guildId: string): boolean {
    const serverState = this.serverStates.get(guildId);
    return serverState ? serverState.isPlaying : false;
  }

  private async autoResumeStreaming() {
    console.log('🔄 Starting auto-resume streaming...');
    
    try {
      const guilds = this.client.guilds.cache;
      
      for (const [guildId, guild] of guilds) {
        const radioChannel = guild.channels.cache.find(
          channel => channel.name.includes('Radio Hub') && channel.isVoiceBased()
        );
        
        if (radioChannel && radioChannel.members.size > 0) {
          console.log(`🎵 Auto-resuming for guild: ${guild.name}`);
          
          // Ambil stasiun terakhir dari database
          let stationToPlay = await this.getLastPlayedStation(guildId);
          
          // Jika tidak ada stasiun tersimpan, gunakan default
          if (!stationToPlay) {
            stationToPlay = {
              id: 1,
              name: "Chill Lofi Radio",
              url: "https://streams.ilovemusic.de/iloveradio17.mp3",
              genre: "Lofi Hip Hop",
              quality: "192kbps",
              artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
              isFavorite: true,
              isActive: true,
              listeners: 127
            };
          }
          
          try {
            await this.playStationForServer(guildId, stationToPlay);
            
            // Update "Now Playing" message di control channel
            const controlChannel = guild.channels.cache.find(
              ch => ch.name.includes('radio-control') && ch.isTextBased()
            );
            if (controlChannel) {
              await this.updateNowPlayingMessage(controlChannel, stationToPlay);
            }
            
            console.log(`✅ Auto-resumed streaming for ${guild.name} with ${stationToPlay.name}`);
          } catch (error) {
            console.error(`❌ Failed to auto-resume for ${guild.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during auto-resume:', error);
    }
  }

  private async getLastPlayedStation(guildId: string): Promise<RadioStation | null> {
    try {
      const server = await storage.getServer(guildId);
      if (server?.lastStationId) {
        const station = await storage.getStation(server.lastStationId);
        if (station) {
          console.log(`📻 Found last played station for ${guildId}: ${station.name}`);
          return station;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting last played station:', error);
      return null;
    }
  }

  private async saveLastPlayedStation(guildId: string, station: RadioStation): Promise<void> {
    try {
      // Validasi station ID exists in database sebelum menyimpan
      const existingStation = await storage.getStation(station.id);
      if (!existingStation) {
        console.log(`⚠️ Station ${station.name} (ID: ${station.id}) not in database, skipping save`);
        return;
      }

      await storage.updateServer(guildId, {
        lastStationId: station.id,
        lastPlaying: true
      });
      console.log(`💾 Saved last played station for ${guildId}: ${station.name}`);
    } catch (error) {
      console.error('Error saving last played station:', error);
    }
  }

  private async updateBotPresence() {
    try {
      const dashboardUrl = process.env.REPLIT_DOMAINS ? 
        `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
        'Dashboard available via /radio dashboard';

      await this.client.user?.setPresence({
        activities: [{
          name: `🎵 24/7 Radio | ${dashboardUrl}`,
          type: 2, // LISTENING
        }],
        status: 'online'
      });

      console.log('Bot presence updated with dashboard link');
    } catch (error) {
      console.error('Error updating bot presence:', error);
    }
  }

  // Cleanup duplicate "now playing" messages in all servers
  async cleanupDuplicateMessages() {
    console.log('🧹 Starting aggressive cleanup of all now playing messages...');
    
    for (const [guildId, guild] of this.client.guilds.cache) {
      try {
        const controlChannel = guild.channels.cache.find(
          (ch: any) => ch.name.includes('radio-control') && ch.isTextBased()
        );
        
        if (controlChannel) {
          console.log(`🔍 Checking ${guild.name} for messages to cleanup...`);
          
          // Fetch more messages to ensure we get all duplicates
          const messages = await (controlChannel as any).messages.fetch({ limit: 100 });
          let deletedCount = 0;
          
          // Clear server state message reference first
          const serverState = this.serverStates.get(guildId);
          if (serverState) {
            serverState.lastNowPlayingMessage = null;
          }
          
          for (const message of messages.values()) {
            if (message.author.id === this.client.user?.id && 
                message.embeds.length > 0 && 
                (message.embeds[0].title?.includes('🎵 Sekarang Memutar') ||
                 message.embeds[0].title?.includes('🎵 Now Playing') ||
                 message.embeds[0].description?.includes('**'))) {
              
              try {
                await message.delete();
                deletedCount++;
                console.log(`🗑️ Force deleted message in ${guild.name}`);
                
                // Add delay between deletions to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (deleteError) {
                console.log(`⚠️ Could not delete specific message in ${guild.name}: ${deleteError.message}`);
              }
            }
          }
          
          if (deletedCount > 0) {
            console.log(`🧹 Force cleaned up ${deletedCount} messages in ${guild.name}`);
          } else {
            console.log(`✅ No messages to cleanup in ${guild.name}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not cleanup messages in ${guild.name}:`, error.message);
      }
    }
    
    console.log('🧹 Aggressive cleanup completed for all servers');
  }

  // Force cleanup for specific server
  async forceCleanupServer(guildId: string) {
    console.log(`🔥 Starting force cleanup for server ${guildId}...`);
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      console.log(`❌ Guild ${guildId} not found`);
      return;
    }
    
    const controlChannel = guild.channels.cache.find(
      (ch: any) => ch.name.includes('radio-control') && ch.isTextBased()
    );
    
    if (controlChannel) {
      try {
        // Clear server state first
        const serverState = this.serverStates.get(guildId);
        if (serverState) {
          serverState.lastNowPlayingMessage = null;
        }
        
        // Fetch ALL recent messages
        const messages = await (controlChannel as any).messages.fetch({ limit: 100 });
        let deletedCount = 0;
        
        for (const message of messages.values()) {
          if (message.author.id === this.client.user?.id) {
            try {
              await message.delete();
              deletedCount++;
              console.log(`🔥 Force deleted bot message in ${guild.name}`);
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              console.log(`⚠️ Could not delete message: ${error.message}`);
            }
          }
        }
        
        console.log(`🔥 Force deleted ${deletedCount} bot messages in ${guild.name}`);
      } catch (error) {
        console.log(`❌ Error in force cleanup: ${error.message}`);
      }
    }
  }
}
