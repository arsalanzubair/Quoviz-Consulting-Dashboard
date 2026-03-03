const WEBHOOK_URL = "https://quoviz.aaagency.cloud/webhook/dashboard-api";

// Module-level cache — works within warm serverless function instances
let cachedWebhookData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isNetworkErr =
                err?.message?.includes('fetch failed') ||
                err?.message?.includes('ECONNREFUSED') ||
                err?.code === 'UND_ERR_CONNECT_TIMEOUT';
            if (isNetworkErr && attempt < retries) {
                console.warn(`[RETRY] Attempt ${attempt}/${retries}: ${err.message}. Retrying in ${delayMs}ms...`);
                await new Promise(r => setTimeout(r, delayMs));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

export async function fetchWebhookData(from?: string, to?: string): Promise<any> {
    const now = Date.now();
    if (cachedWebhookData && (now - lastFetchTime < CACHE_TTL)) {
        return cachedWebhookData;
    }

    const d = new Date();
    const defaultFrom = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const defaultTo = d.toISOString().split('T')[0];

    const params = new URLSearchParams({
        from_date: from || defaultFrom,
        to_date: to || defaultTo,
    });

    console.log(`[Webhook] Fetching: ${WEBHOOK_URL}?${params.toString()}`);

    const response = await withRetry(() =>
        fetch(`${WEBHOOK_URL}?${params.toString()}`)
    );

    if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : data;

    cachedWebhookData = result;
    lastFetchTime = now;
    return result;
}
