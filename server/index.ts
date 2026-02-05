import "dotenv/config";
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

console.log("[Server] Modules loaded, initializing application...");

const app = express();
const httpServer = createServer(app);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Trust proxy for secure cookies on Render
app.set("trust proxy", 1);

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
    return;
  }

  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Basic middleware
setupAuth(app);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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
      log(logLine);
    }
  });

  next();
});

// Initialize routes synchronously
try {
  registerRoutes(httpServer, app);
  log("✓ Routes registered successfully");
} catch (err) {
  log(`✗ Critical error during route registration: ${err}`);
  console.error(err);
}

// Error handling middleware (should be after routes)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`, err);
  res.status(status).json({
    message,
    details: err.message,
    stack: err.stack
  });
});

export { app, httpServer };

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  (async () => {
    try {
      // Test database connection
      try {
        await db.execute(sql`SELECT 1`);
        log("✓ Database connected successfully");
      } catch (err) {
        log(`✗ Database connection failed: ${err}`);
      }

      // Inicializar banco de dados e semear dados de forma segura
      try {
        await storage.initializeDatabase();
        log("✓ Database initialized successfully");
        await storage.seedDefaultData();
        log("✓ Default data seeded successfully");
      } catch (err) {
        log(`⚠ Database initialization/seeding skipped: ${err}`);
      }

      const port = parseInt(process.env.PORT || "5001", 10);
      httpServer.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    } catch (err) {
      log(`Fatal error during startup: ${err}`);
      process.exit(1);
    }
  })();
}
