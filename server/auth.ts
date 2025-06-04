import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
// Dynamic callback URL untuk berbagai environment
let CALLBACK_URL: string;
if (process.env.RAILWAY_STATIC_URL) {
  // Railway environment - gunakan Railway domain
  CALLBACK_URL = `https://${process.env.RAILWAY_STATIC_URL}/auth/discord/callback`;
} else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  // Railway public domain
  CALLBACK_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/auth/discord/callback`;
} else if (process.env.REPLIT_DOMAINS) {
  // Replit environment
  CALLBACK_URL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/auth/discord/callback`;
} else if (process.env.DISCORD_CALLBACK_URL) {
  // Custom callback URL dari environment variable
  CALLBACK_URL = process.env.DISCORD_CALLBACK_URL;
} else {
  // Development fallback
  CALLBACK_URL = 'https://6e95161e-b64d-431e-8cd2-50e32ec5aba8-00-5csjl7febkjm.janeway.replit.dev/auth/discord/callback';
}

console.log('Discord OAuth2 configuration:');
console.log('- Client ID available:', !!DISCORD_CLIENT_ID);
console.log('- Client Secret available:', !!DISCORD_CLIENT_SECRET);
console.log('- Callback URL:', CALLBACK_URL);

// Configure passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      // User not found, clear session
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error instanceof Error ? error.message : String(error));
    done(null, false);
  }
});

// Configure Discord OAuth2 strategy
if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('Discord profile received:', {
        id: profile.id,
        username: profile.username,
        global_name: profile.global_name,
        displayName: profile.displayName,
        avatar: profile.avatar
      });

      // Fetch additional user info from Discord API to get the latest display name
      let discordDisplayName = profile.username;
      try {
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Valkyrion-Bot/1.0'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Discord API user data:', {
            username: userData.username,
            global_name: userData.global_name,
            display_name: userData.display_name
          });
          discordDisplayName = userData.global_name || userData.display_name || userData.username;
        }
      } catch (apiError) {
        console.log('Could not fetch additional Discord user data, using profile data');
      }

      // Check if user already exists by Discord ID first
      const existingUser = await storage.getUserByDiscordId(profile.id);

      if (existingUser) {
        // Update existing user's tokens and info
        const updatedUser = await storage.updateUser(existingUser.id, {
          displayName: discordDisplayName,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          accessToken,
          refreshToken
        });
        console.log('Updated user with display name:', discordDisplayName);
        return done(null, updatedUser);
      } else {
        // Create new user with unique username
        let username = profile.username;
        let counter = 1;
        
        // Check if username already exists, if so append counter
        while (await storage.getUserByUsername(username)) {
          username = `${profile.username}_${counter}`;
          counter++;
        }
        
        const newUser = await storage.createUser({
          username: username,
          displayName: discordDisplayName,
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          accessToken,
          refreshToken
        });
        console.log('Created new user with display name:', discordDisplayName);
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Discord authentication error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('Discord OAuth2 credentials not configured - authentication disabled');
}

// Helper function to check if user has access to a Discord server
export async function getUserServerAccess(userId: number): Promise<string[]> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.accessToken) {
      return [];
    }

    // Fetch user's Discord guilds using their access token
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'User-Agent': 'Valkyrion-Bot/1.0'
      }
    });

    if (response.ok) {
      const guilds = await response.json();
      return guilds.map((guild: any) => guild.id);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user server access:', error);
    return [];
  }
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to require server access
export function requireServerAccess(serverId: string) {
  return async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userServers = await getUserServerAccess(req.user.id);
    if (userServers.includes(serverId)) {
      return next();
    }

    res.status(403).json({ error: 'Access denied to this server' });
  };
}

export default passport;