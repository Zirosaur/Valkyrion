import { db } from "./db";
import { 
  users, 
  radioStations, 
  discordServers, 
  botStatus,
  type User,
  type RadioStation, 
  type DiscordServer,
  type BotStatus,
  type InsertUser,
  type InsertRadioStation,
  type InsertDiscordServer
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Radio station methods
  getAllStations(): Promise<RadioStation[]>;
  getStation(id: number): Promise<RadioStation | undefined>;
  createStation(station: InsertRadioStation): Promise<RadioStation>;
  updateStation(id: number, updates: Partial<InsertRadioStation>): Promise<RadioStation | undefined>;
  deleteStation(id: number): Promise<boolean>;
  getFavoriteStations(): Promise<RadioStation[]>;
  setStationFavorite(id: number, isFavorite: boolean): Promise<boolean>;

  // Discord server methods
  getAllServers(): Promise<DiscordServer[]>;
  getServer(id: string): Promise<DiscordServer | undefined>;
  createServer(server: InsertDiscordServer): Promise<DiscordServer>;
  updateServer(id: string, updates: Partial<DiscordServer>): Promise<DiscordServer | undefined>;
  deleteServer(id: string): Promise<boolean>;

  // Bot status methods
  getBotStatus(): Promise<BotStatus | undefined>;
  updateBotStatus(updates: Partial<BotStatus>): Promise<BotStatus>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.discordId, discordId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by Discord ID:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(desc(users.id));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllStations(): Promise<RadioStation[]> {
    try {
      return await db.select().from(radioStations).orderBy(radioStations.name);
    } catch (error) {
      console.error('Error getting all stations:', error);
      return [];
    }
  }

  async getStation(id: number): Promise<RadioStation | undefined> {
    try {
      const result = await db.select().from(radioStations).where(eq(radioStations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting station:', error);
      return undefined;
    }
  }

  async createStation(station: InsertRadioStation): Promise<RadioStation> {
    try {
      const result = await db.insert(radioStations).values(station).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  }

  async updateStation(id: number, updates: Partial<InsertRadioStation>): Promise<RadioStation | undefined> {
    try {
      const result = await db.update(radioStations).set(updates).where(eq(radioStations.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating station:', error);
      return undefined;
    }
  }

  async deleteStation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(radioStations).where(eq(radioStations.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting station:', error);
      return false;
    }
  }

  async getFavoriteStations(): Promise<RadioStation[]> {
    try {
      return await db.select().from(radioStations).where(eq(radioStations.isFavorite, true));
    } catch (error) {
      console.error('Error getting favorite stations:', error);
      return [];
    }
  }

  async setStationFavorite(id: number, isFavorite: boolean): Promise<boolean> {
    try {
      const result = await db.update(radioStations).set({ isFavorite }).where(eq(radioStations.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error setting station favorite:', error);
      return false;
    }
  }

  async getAllServers(): Promise<DiscordServer[]> {
    try {
      return await db.select().from(discordServers).orderBy(discordServers.id);
    } catch (error) {
      console.error('Error getting all servers:', error);
      return [];
    }
  }

  async getServer(id: string): Promise<DiscordServer | undefined> {
    try {
      const result = await db.select().from(discordServers).where(eq(discordServers.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting server:', error);
      return undefined;
    }
  }

  async createServer(server: InsertDiscordServer): Promise<DiscordServer> {
    try {
      const result = await db.insert(discordServers).values(server).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating server:', error);
      throw error;
    }
  }

  async updateServer(id: string, updates: Partial<DiscordServer>): Promise<DiscordServer | undefined> {
    try {
      const result = await db.update(discordServers).set(updates).where(eq(discordServers.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating server:', error);
      return undefined;
    }
  }

  async deleteServer(id: string): Promise<boolean> {
    try {
      const result = await db.delete(discordServers).where(eq(discordServers.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting server:', error);
      return false;
    }
  }

  async getBotStatus(): Promise<BotStatus | undefined> {
    try {
      const result = await db.select().from(botStatus).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting bot status:', error);
      return undefined;
    }
  }

  async updateBotStatus(updates: Partial<BotStatus>): Promise<BotStatus> {
    try {
      const existing = await this.getBotStatus();
      if (existing) {
        const result = await db.update(botStatus).set({ ...updates, lastUpdated: new Date() }).where(eq(botStatus.id, existing.id)).returning();
        return result[0];
      } else {
        const result = await db.insert(botStatus).values({ id: 1, ...updates, lastUpdated: new Date() }).returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error updating bot status:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();