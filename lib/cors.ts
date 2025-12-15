import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

/**
 * Set CORS headers on response
 */
export const setCorsHeaders = (res: VercelResponse, origin?: string): void => {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
};

/**
 * Handle CORS preflight request
 * Returns true if this was a preflight request (OPTIONS) and was handled
 */
export const handleCors = (req: VercelRequest, res: VercelResponse): boolean => {
    const origin = req.headers.origin as string | undefined;
    setCorsHeaders(res, origin);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }

    return false;
};

/**
 * Middleware wrapper for CORS
 */
export const withCors = (
    handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) => {
    return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
        if (handleCors(req, res)) {
            return;
        }
        await handler(req, res);
    };
};
