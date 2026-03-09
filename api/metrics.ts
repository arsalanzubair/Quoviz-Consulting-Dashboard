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
           GET TODAY DATE
        --------------------------- */

        const today = new Date();

        const todayMonth = today.toLocaleString('en-US', { month: 'short' });
        const todayDay = today.getDate();

        /* ---------------------------
           CALCULATE METRICS
        --------------------------- */

        const totalCalls = records.length;

        const totalAppointments = records.filter(
            (r: any) => r.appointment_booked
        ).length;

        const callsToday = records.filter((r: any) => {

            if (!r.created_at) return false;

            const parts = r.created_at.split(',');

            if (!parts.length) return false;

            const [month, day] = parts[0].split(' ');

            return month === todayMonth && Number(day) === todayDay;

        }).length;

        const appointmentsToday = records.filter((r: any) => {

            if (!r.created_at) return false;

            const parts = r.created_at.split(',');

            if (!parts.length) return false;

            const [month, day] = parts[0].split(' ');

            return (
                month === todayMonth &&
                Number(day) === todayDay &&
                r.appointment_booked
            );

        }).length;

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
