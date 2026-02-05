import { app } from '../server/index';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("[Debug API] In handler");
    try {
        // We just want to see if we can reach this point
        res.status(200).json({
            status: 'reached_handler',
            url: req.url,
            method: req.method
        });
    } catch (err: any) {
        console.error("[Debug API] Error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
