import { db } from "./db";
import { radioStations, botStatus } from "@shared/schema";

async function initializeDatabase() {
  try {
    console.log("Initializing database with default data...");

    // Check if stations already exist
    const existingStations = await db.select().from(radioStations);
    if (existingStations.length === 0) {
      // Insert complete radio stations dataset (33 stations) - exact copy from current database
      const defaultStations = [
        {
          name: "Chill Lofi Radio",
          url: "https://streams.ilovemusic.de/iloveradio17.mp3",
          genre: "Lofi Hip Hop",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 456,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Jazz Cafe Radio",
          url: "https://streams.ilovemusic.de/iloveradio14.mp3",
          genre: "Smooth Jazz",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 234,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Rock Classic Radio",
          url: "https://streams.ilovemusic.de/iloveradio6.mp3",
          genre: "Classic Rock",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 156,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Electronic Beats",
          url: "https://streams.ilovemusic.de/iloveradio2.mp3",
          genre: "Electronic Dance",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 203,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Indie Folk Radio",
          url: "https://streams.ilovemusic.de/iloveradio11.mp3",
          genre: "Indie Folk",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 67,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Classical Music",
          url: "https://streams.ilovemusic.de/iloveradio16.mp3",
          genre: "Classical",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 94,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Hard Rock FM",
          url: "https://n0d.radiojar.com/7csmg90fuqruv?rj-ttl=5&rj-tok=AAABknEEOWgA57CrPbV-ZaXFdw",
          genre: "Hard Rock",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 456,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Pop Hits 24/7",
          url: "https://streams.ilovemusic.de/iloveradio1.mp3",
          genre: "Top 40 Hits",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 312,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Country Roads Radio",
          url: "https://streams.ilovemusic.de/iloveradio7.mp3",
          genre: "Country",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1520637836862-4d197d17c2a4?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 145,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Reggae Vibes",
          url: "https://streams.ilovemusic.de/iloveradio8.mp3",
          genre: "Reggae",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 78,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "J1HITS",
          url: "https://jenny.torontocast.com:8056/;stream.",
          genre: "Pop Hits",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 245,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "J1HD",
          url: "https://maggie.torontocast.com:2000/stream/J1HD?_=696726",
          genre: "Top 40",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 189,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "BIG B RADIO #KPOP",
          url: "https://antares.dribbcast.com/proxy/kpop?mp=/s",
          genre: "K-Pop",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 567,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "BIG B RADIO #JPOP",
          url: "https://antares.dribbcast.com/proxy/jpop?mp=/s",
          genre: "J-Pop",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 423,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "BIG B RADIO #CPOP",
          url: "https://antares.dribbcast.com/proxy/cpop?mp=/s",
          genre: "C-Pop",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 234,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "BIG B RADIO #APOP",
          url: "https://antares.dribbcast.com/proxy/apop?mp=/s",
          genre: "Asian Pop",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 345,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Prambors FM",
          url: "https://streams.ilovemusic.de/iloveradio3.mp3",
          genre: "Indonesian Pop",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 892,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Radio Indonesia",
          url: "https://rri-jakarta.out.airtime.pro/rri-jakarta_a",
          genre: "Indonesian News & Music",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 1245,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Gen FM",
          url: "https://live.genfm.id/genfm",
          genre: "Indonesian Pop",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 678,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Most FM",
          url: "https://n0a.radiojar.com/4wyz4p9fu5tv",
          genre: "Indonesian Hits",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 534,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Spotify Hits Radio",
          url: "https://streaming.live365.com/a33708",
          genre: "Global Hits",
          quality: "256kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 2156,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Chillhop Radio",
          url: "https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/",
          genre: "Chillhop",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 987,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Deep House Radio",
          url: "https://cast1.torontocast.com:2060/stream",
          genre: "Deep House",
          quality: "192kbps",
          artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 765,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "BBC Radio 1",
          url: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
          genre: "Pop & Dance",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 1234,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Radio FG",
          url: "http://radiofg.impek.com/fg",
          genre: "Electronic Dance",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 567,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "NRJ",
          url: "http://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3",
          genre: "Pop Hits",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 890,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "SomaFM - Groove Salad",
          url: "http://ice1.somafm.com/groovesalad-128-mp3",
          genre: "Ambient Chill",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 445,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Radio Swiss Jazz",
          url: "http://stream.srg-ssr.ch/m/rsj/mp3_128",
          genre: "Jazz",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 234,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Venice Classic Radio",
          url: "http://174.36.206.197:8000/stream",
          genre: "Classical",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 123,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Radio Campus",
          url: "http://radiocampus.u-bordeaux.fr:8000/stream.mp3",
          genre: "Alternative Rock",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 189,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Ibiza Global Radio",
          url: "http://ibizaglobalradio.streaming-pro.com:8024/;stream.mp3",
          genre: "House & Techno",
          quality: "128kbps",
          artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 678,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "KEXP",
          url: "http://live-aacplus-64.kexp.org/kexp64.aac",
          genre: "Indie Alternative",
          quality: "64kbps",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 345,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        },
        {
          name: "Radio Paradise",
          url: "http://stream.radioparadise.com/aac-320",
          genre: "Eclectic Mix",
          quality: "320kbps",
          artwork: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=120&h=120&fit=crop",
          isFavorite: false,
          isActive: true,
          listeners: 567,
          uptime: 100,
          averageLatency: 50,
          popularityScore: 0
        }
      ];

      // Insert all 33 radio stations
      await db.insert(radioStations).values(defaultStations);
      console.log(`Successfully inserted ${defaultStations.length} radio stations`);
    } else {
      console.log(`Database already has ${existingStations.length} radio stations`);
    }

    // Initialize bot status if not exists
    const existingBotStatus = await db.select().from(botStatus);
    if (existingBotStatus.length === 0) {
      await db.insert(botStatus).values([{
        isOnline: true,
        uptime: 0,
        memoryUsage: 0,
        totalListeners: 0,
        lastHeartbeat: new Date()
      }]);
      console.log("Bot status initialized");
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export { initializeDatabase };