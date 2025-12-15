import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
}
