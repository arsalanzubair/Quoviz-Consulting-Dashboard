import type { IncomingMessage, ServerResponse } from 'http';
import { parseJsonBody, signToken, getTokenCookieHeader, sendJson } from './_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const body = await parseJsonBody(req);
    const { password } = body;

    if (!process.env.ADMIN_PASSWORD) {
        console.error('[login] ADMIN_PASSWORD env var is not set');
        return sendJson(res, 500, { error: 'Server misconfiguration' });
    }

    if (password === process.env.ADMIN_PASSWORD) {
        const token = signToken();
        res.setHeader('Set-Cookie', getTokenCookieHeader(token));
        return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 401, { error: 'Invalid password' });
}
