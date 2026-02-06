import pg from 'pg';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const version = (pg as any).version || 'unknown';
        res.status(200).json({ status: 'import_ok', pg_version: version });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
