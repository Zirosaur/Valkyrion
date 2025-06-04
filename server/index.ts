import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { config } from "dotenv";

// Load environment variables
config();

// Debug environment variables
console.log('Environment variables check:');
console.log('- DISCORD_TOKEN present:', !!process.env.DISCORD_TOKEN);
console.log('- DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
console.log('- DISCORD_CLIENT_SECRET present:', !!process.env.DISCORD_CLIENT_SECRET);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Early health check for Railway (before any initialization)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Start server first for health check availability
  const server = await registerRoutes(app);
  
  // Initialize database with error handling
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Continue without crashing - health check still works
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });



  // Health check endpoint for API
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "Valkyrion Discord Bot is running", 
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      message: "Bot streaming 24/7 di Discord servers"
    });
  });

  // Setup Vite for development or serve static files for production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Use PORT from environment (Railway) or default to 5000
  const port = parseInt(process.env.PORT || '5000');
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
  
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
