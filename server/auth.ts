import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import type { User, UserRole } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      fullName: string | null;
      role: UserRole | string | null;
      status: string | null;
      team: string | null;
    }
  }
}

// function hashPassword and comparePasswords removed as they relied on local password storage


export function setupAuth(app: Express): void {
  const PgSession = connectPgSimple(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Forçado para garantir compatibilidade com Supabase/pooler
  });

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "fincontrol-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password) {
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false);
        }

        return done(null, {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          team: user.team,
        });
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        team: user.team,
      });
    } catch (err) {
      done(err);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  console.log(`[Auth Debug] Checking requirement for ${req.path}`);
  console.log(`[Auth Debug] IsAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Auth Debug] Session ID: ${req.sessionID}`);
  console.log(`[Auth Debug] User:`, req.user ? { id: req.user.id, username: req.user.username } : "null");

  if (!req.isAuthenticated()) {
    console.log(`[Auth Debug] Rejecting with 401 for ${req.path}`);
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    console.log(`[Auth Debug] Checking role for ${req.path}, allowed: ${roles}`);
    if (!req.isAuthenticated()) {
      console.log(`[Auth Debug] Rejecting with 401 (not auth) for ${req.path}`);
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (!roles.includes(req.user!.role as UserRole)) {
      console.log(`[Auth Debug] Rejecting with 403 (wrong role ${req.user!.role}) for ${req.path}`);
      return res.status(403).json({ error: "Sem permissão para esta ação" });
    }
    next();
  };
};

export const requireAdmin: RequestHandler = requireRole("admin");
export const requireFinancial: RequestHandler = requireRole("admin", "financial");
export const requireViewer: RequestHandler = requireRole("admin", "financial", "viewer");
