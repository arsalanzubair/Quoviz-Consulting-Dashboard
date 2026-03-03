import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'http';

const SECRET = process.env.SESSION_SECRET || 'default-secret-change-me';
export const COOKIE_NAME = 'auth_token';

export function signToken(): string {
    return jwt.sign({ admin: true }, SECRET, { expiresIn: '24h' });
}

export function verifyToken(req: IncomingMessage): boolean {
    try {
        const cookies = parseCookies(req);
        const token = cookies[COOKIE_NAME];
        if (!token) return false;
        jwt.verify(token, SECRET);
        return true;
    } catch {
        return false;
    }
}

export function getTokenCookieHeader(token: string): string {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
}

export function clearTokenCookieHeader(): string {
    return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
    const cookieHeader = req.headers.cookie || '';
    const result: Record<string, string> = {};
    cookieHeader.split(';').forEach(part => {
        const [key, ...val] = part.trim().split('=');
        if (key && key.trim()) {
            result[key.trim()] = decodeURIComponent(val.join('='));
        }
    });
    return result;
}

export async function parseJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch { resolve({}); }
        });
        req.on('error', () => resolve({}));
    });
}

export function sendJson(res: any, statusCode: number, data: any): void {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
}
