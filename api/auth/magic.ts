import type { IncomingMessage, ServerResponse } from 'http';
import { signToken, getTokenCookieHeader } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const magicToken = process.env.MAGIC_TOKEN;

    if (magicToken && token === magicToken) {
        const jwtToken = signToken();
        res.setHeader('Set-Cookie', getTokenCookieHeader(jwtToken));
        console.log('[AUTH] Admin logged in via Magic Link');
        res.setHeader('Location', '/');
        res.statusCode = 302;
        res.end();
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 401;
    res.end(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
      <h1 style="color: #ef4444;">Access Denied</h1>
      <p>Invalid or missing magic token.</p>
      <a href="/" style="color: #6366f1; text-decoration: none;">Return to Dashboard</a>
    </div>
  `);
}
