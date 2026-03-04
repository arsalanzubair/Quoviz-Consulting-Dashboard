import type { IncomingMessage, ServerResponse } from 'http';
import { parseJsonBody, signToken, getTokenCookieHeader, sendJson } from './_lib/auth.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const body = await parseJsonBody(req);
    const { password } = body;

    const expectedPassword = (process.env.ADMIN_PASSWORD || '')
        .replace(/^["'](.+)["']$/, '$1')
        .trim();

    const receivedPassword = (password || '').trim();

    if (!expectedPassword) {
        console.error('[login] ADMIN_PASSWORD env var is not set');

        return sendJson(res, 500, {
            error: 'Server misconfiguration'
        });
    }

    if (receivedPassword === expectedPassword) {
        const token = signToken();

        res.setHeader('Set-Cookie', getTokenCookieHeader(token));

        return sendJson(res, 200, {
            success: true
        });
    }

    console.log(`[login] Password mismatch. Expected: ${expectedPassword}, Received: ${receivedPassword}`);

    return sendJson(res, 401, {
        error: 'Invalid password'
    });
}
