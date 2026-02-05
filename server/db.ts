import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "";

export const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
