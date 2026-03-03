import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken, sendJson } from './_lib/auth';
import { fetchWebhookData } from './_lib/webhook';

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
        let records = (webhookData?.table || []).map((r: any) => {
            // Parse duration "M:SS" string into seconds
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
                appointment_booked: r.appointment === 'YES',
            };
        });

        // In-memory filtering
        if (search) {
            const s = search.toLowerCase();
            records = records.filter((r: any) =>
                (r.lead_name || '').toLowerCase().includes(s) ||
                (r.phone_number || '').toLowerCase().includes(s)
            );
        }

        if (type) {
            records = records.filter((r: any) =>
                (r.type || '').toLowerCase() === type.toLowerCase()
            );
        }

        if (status) {
            records = records.filter((r: any) =>
                (r.status || '').toLowerCase() === status.toLowerCase()
            );
        }

        const total = records.length;
        const offset = (page - 1) * limit;
        const paginatedRecords = records.slice(offset, offset + limit);

        return sendJson(res, 200, { data: paginatedRecords, total });
    } catch (error: any) {
        console.error('[call-records] Error:', error.message);
        return sendJson(res, 500, { error: error.message || 'Internal server error' });
    }
}
