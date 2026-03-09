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
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const type = url.searchParams.get('type') || '';
        const status = url.searchParams.get('status') || '';

        const webhookData = await fetchWebhookData();

        /* ---------------------------------
           NORMALIZE RECORD STRUCTURE
        --------------------------------- */

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


        /* ---------------------------------
           REMOVE DUPLICATE RECORDS
        --------------------------------- */

        const uniqueMap = new Map();

        for (const record of records) {

            const key = `${record.phone_number}-${record.created_at}-${record.duration}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, record);
            }

        }

        records = Array.from(uniqueMap.values());


        /* ---------------------------------
           SEARCH FILTER
        --------------------------------- */

        if (search) {

            const s = search.toLowerCase();

            records = records.filter((r: any) =>
                (r.lead_name || '').toLowerCase().includes(s) ||
                (r.phone_number || '').toLowerCase().includes(s)
            );

        }


        /* ---------------------------------
           TYPE FILTER
        --------------------------------- */

        if (type) {

            records = records.filter((r: any) =>
                (r.type || '').toLowerCase() === type.toLowerCase()
            );

        }


        /* ---------------------------------
           STATUS FILTER
        --------------------------------- */

        if (status) {

            records = records.filter((r: any) =>
                (r.status || '').toLowerCase() === status.toLowerCase()
            );

        }


        /* ---------------------------------
           PAGINATION
        --------------------------------- */

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
