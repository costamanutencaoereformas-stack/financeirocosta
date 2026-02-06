import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("[Debug DB] Starting...");
    try {
        const result = await db.execute(sql`SELECT 1 as connected`);
        res.status(200).json({ status: 'ok', result });
    } catch (err: any) {
        console.error("[Debug DB] Error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
