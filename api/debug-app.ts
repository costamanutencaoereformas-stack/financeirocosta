import { app } from '../server/index';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("[Debug API] In handler, calling app...");
    try {
        return app(req, res);
    } catch (err: any) {
        console.error("[Debug API] Error invoking app:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
