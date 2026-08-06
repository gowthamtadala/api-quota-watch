const axios = require('axios');

/**
 * Mistral AI Provider
 *
 * Rate limits returned on every response via X-RateLimit-* headers.
 * Enforced at org level. Headers include per-minute token and request limits.
 *
 * Headers parsed:
 *   X-RateLimit-Limit-Tokens     / X-RateLimit-Remaining-Tokens     / X-RateLimit-Reset-Tokens
 *   X-RateLimit-Limit-Requests   / X-RateLimit-Remaining-Requests   / X-RateLimit-Reset-Requests
 */
class MistralProvider {
    constructor(apiKey) {
        this.apiKey  = apiKey;
        this.baseURL = 'https://api.mistral.ai/v1';
    }

    async getQuota() {
        let headers = {};

        try {
            // Minimal inference call using mistral-small (cheapest, always available)
            const res = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model:      'mistral-small-latest',
                    max_tokens: 1,
                    messages:   [{ role: 'user', content: 'hi' }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type':  'application/json'
                    }
                }
            );
            headers = res.headers;
        } catch (err) {
            if (err.response?.status === 401) throw new Error('Invalid Mistral API key');
            if (err.response?.status === 403) throw new Error('API key lacks permissions');
            if (err.response?.headers) {
                headers = err.response.headers;
            } else {
                throw new Error(`Mistral API error: ${err.message}`);
            }
        }

        // Normalize header keys to lowercase for safe access
        const h = {};
        for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = v;

        const tokLimit     = parseInt(h['x-ratelimit-limit-tokens']     || 0);
        const tokRemaining = parseInt(h['x-ratelimit-remaining-tokens'] || tokLimit);
        const tokReset     = h['x-ratelimit-reset-tokens'] || null;

        const reqLimit     = parseInt(h['x-ratelimit-limit-requests']     || 0);
        const reqRemaining = parseInt(h['x-ratelimit-remaining-requests'] || reqLimit);
        const reqReset     = h['x-ratelimit-reset-requests'] || null;

        const useTokens = tokLimit > 0;
        const limit     = useTokens ? tokLimit     : reqLimit;
        const remaining = useTokens ? tokRemaining : reqRemaining;
        const unit      = useTokens ? 'tokens/min' : 'requests/min';

        // Reset is typically an ISO timestamp or seconds integer
        const rawReset  = useTokens ? tokReset : reqReset;
        const resetAt   = rawReset ? this._parseReset(rawReset) : null;

        return {
            used: limit - remaining,
            limit,
            unit,
            resetsAt: resetAt,
            details: {
                tokenLimit: tokLimit,
                tokenRemaining: tokRemaining,
                requestLimit: reqLimit,
                requestRemaining: reqRemaining
            }
        };
    }

    _parseReset(value) {
        // Could be ISO string, Unix timestamp (seconds), or integer offset
        if (!value) return null;
        const num = Number(value);
        if (!isNaN(num)) {
            // If small number (< 1e10), treat as seconds offset from now
            const ts = num < 1e10 ? Date.now() + num * 1000 : num * 1000;
            return new Date(ts).toISOString();
        }
        try { return new Date(value).toISOString(); } catch { return null; }
    }
}

module.exports = MistralProvider;
