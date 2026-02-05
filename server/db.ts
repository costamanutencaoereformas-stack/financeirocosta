import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
}

const connectionString = process.env.DATABASE_URL || "";

export const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }, // Forçado para garantir compatibilidade com Supabase/pooler
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
