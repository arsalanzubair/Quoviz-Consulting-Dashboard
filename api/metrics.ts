import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken, sendJson } from './_lib/auth.js';
import { fetchWebhookData } from './_lib/webhook.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    if (!verifyToken(req)) {
        return sendJson(res, 401, { error: 'Unauthorized' });
    }

    try {
        const webhookData = await fetchWebhookData();
        const summary = webhookData?.summary || {};

        return sendJson(res, 200, {
            totalCalls: summary.total_calls ?? 0,
            totalAppointments: summary.total_appointments ?? 0,
            callsToday: summary.calls_today ?? 0,
            appointmentsToday: summary.appointments_today ?? 0
        });

    } catch (error: any) {
        console.error('[metrics] Error:', error.message);

        return sendJson(res, 500, {
            error: error.message || 'Internal server error'
        });
    }
}
