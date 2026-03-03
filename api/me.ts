import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken, sendJson } from './_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const authenticated = verifyToken(req);
    return sendJson(res, 200, { authenticated });
}
