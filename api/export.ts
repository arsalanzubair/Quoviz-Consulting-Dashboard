import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken } from './_lib/auth.js';
import { fetchWebhookData } from './_lib/webhook.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    if (!verifyToken(req)) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    try {
        const webhookData = await fetchWebhookData();
        const records = webhookData?.table || [];

        if (records.length === 0) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'No records found' }));
            return;
        }

        const headers = [
            'id',
            'lead_name',
            'phone_number',
            'type',
            'status',
            'duration',
            'appointment',
            'source',
            'created_date',
            'transcript',
            'recording_url'
        ];

        const csvRows: string[] = [];
        csvRows.push(headers.join(','));

        for (const record of records) {
            const row = headers.map(header => {
                const val = record?.[header] ?? '';

                const sanitized = String(val)
                    .replace(/\r?\n|\r/g, ' ')
                    .replace(/"/g, '""');

                return `"${sanitized}"`;
            });

            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\r\n');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="quoviz_call_records.csv"');

        res.end(csvContent);

    } catch (error: any) {
        console.error('[export] Error:', error.message);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}
