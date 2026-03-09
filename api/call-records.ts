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

        const url = new URL(req.url || '', `http://${req.headers.host}`);

        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '5');
        const search = url.searchParams.get('search') || '';
        const type = url.searchParams.get('type') || '';

        const webhookData = await fetchWebhookData();

        /* ---------------------------
           NORMALIZE RECORD STRUCTURE
        --------------------------- */

        let records = (webhookData?.table || []).map((r: any) => {

            let duration_seconds = 0;

            if (r.duration && typeof r.duration === 'string') {
                const parts = r.duration.split(':');
                if (parts.length === 2) {
                    duration_seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                }
            }

            return {
                ...r,
                call_type: (r.type || 'OTHER').toLowerCase(),
                call_status: (r.status || 'UNKNOWN').toLowerCase(),
                duration_seconds,
                created_at: r.created_date,
                appointment_booked: r.appointment === 'YES'
            };

        });

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
           SORT BY LATEST FIRST
        --------------------------- */

        records.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        /* ---------------------------
           SEARCH FILTER
        --------------------------- */

        if (search) {

            const s = search.toLowerCase();

            records = records.filter((r: any) =>
                (r.lead_name || '').toLowerCase().includes(s) ||
                (r.phone_number || '').toLowerCase().includes(s)
            );

        }

        /* ---------------------------
           TYPE FILTER
        --------------------------- */

        if (type) {

            records = records.filter((r: any) =>
                (r.call_type || '').toLowerCase() === type.toLowerCase()
            );

        }

        /* ---------------------------
           PAGINATION
        --------------------------- */

        const total = records.length;

        const offset = (page - 1) * limit;

        const paginatedRecords = records.slice(offset, offset + limit);

        return sendJson(res, 200, {
            data: paginatedRecords,
            total
        });

    } catch (error: any) {

        console.error('[call-records] Error:', error.message);

        return sendJson(res, 500, {
            error: error.message || 'Internal server error'
        });

    }

}
