import type { IncomingMessage, ServerResponse } from 'http';
import { clearTokenCookieHeader, sendJson } from './_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    res.setHeader('Set-Cookie', clearTokenCookieHeader());
    return sendJson(res, 200, { success: true });
}
