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

        /* ---------------------------
           NORMALIZE RECORD STRUCTURE
        --------------------------- */

        let records = (webhookData?.table || []).map((r: any) => ({
            ...r,
            created_at: r.created_date,
            appointment_booked: r.appointment === 'YES'
        }));

        /* ---------------------------
           REMOVE DUPLICATES
        --------------------------- */

        const seen = new Set();

        records = records.filter((r: any) => {

            const key = `${r.phone_number}-${r.created_at}-${r.duration}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;

        });

        /* ---------------------------
           CALCULATE METRICS
        --------------------------- */

        const today = new Date().toISOString().slice(0, 10);

        const totalCalls = records.length;

        const totalAppointments = records.filter(
            (r: any) => r.appointment_booked
        ).length;

        const callsToday = records.filter((r: any) =>
            r.created_at?.startsWith(today)
        ).length;

        const appointmentsToday = records.filter((r: any) =>
            r.created_at?.startsWith(today) && r.appointment_booked
        ).length;

        return sendJson(res, 200, {
            totalCalls,
            totalAppointments,
            callsToday,
            appointmentsToday
        });

    } catch (error: any) {

        console.error('[metrics] Error:', error.message);

        return sendJson(res, 500, {
            error: error.message || 'Internal server error'
        });

    }

}
