import pg from 'pg';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("[Debug Minimal PG] Loading...");
    try {
        const { Pool } = pg;
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        console.log("[Debug Minimal PG] Pool created, connecting...");
        const client = await pool.connect();
        console.log("[Debug Minimal PG] Connected!");
        const result = await client.query('SELECT 1 as ok');
        client.release();
        res.status(200).json({ status: 'ok', result: result.rows });
    } catch (err: any) {
        console.error("[Debug Minimal PG] Error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
