const axios = require('axios');

/**
 * Groq Provider
 *
 * Rate limits are returned on EVERY response via x-ratelimit-* headers.
 * Groq enforces at org level (not per key), so this reflects the full org pool.
 *
 * Headers parsed:
 *   x-ratelimit-limit-tokens       / x-ratelimit-remaining-tokens       / x-ratelimit-reset-tokens
 *   x-ratelimit-limit-requests     / x-ratelimit-remaining-requests     / x-ratelimit-reset-requests
 */
class GroqProvider {
    constructor(apiKey) {
        this.apiKey  = apiKey;
        this.baseURL = 'https://api.groq.com/openai/v1';
    }

    async getQuota() {
        let headers = {};

        try {
            // Minimal chat completion to get rate-limit headers back.
            // llama-3.1-8b-instant is free tier and tiny — near zero cost.
            const res = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'llama-3.1-8b-instant',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'hi' }]
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
            if (err.response?.status === 401) throw new Error('Invalid Groq API key');
            if (err.response?.status === 403) throw new Error('API key lacks permissions');
            // On rate-limit (429) or other errors, headers are still present
            if (err.response?.headers) {
                headers = err.response.headers;
            } else {
                throw new Error(`Groq API error: ${err.message}`);
            }
        }

        // Token-level limits (most meaningful for AI spend)
        const tokLimit     = parseInt(headers['x-ratelimit-limit-tokens']     || 0);
        const tokRemaining = parseInt(headers['x-ratelimit-remaining-tokens'] || tokLimit);
        const tokReset     = headers['x-ratelimit-reset-tokens'] || null;

        // Request-level limits (fallback)
        const reqLimit     = parseInt(headers['x-ratelimit-limit-requests']     || 0);
        const reqRemaining = parseInt(headers['x-ratelimit-remaining-requests'] || reqLimit);
        const reqReset     = headers['x-ratelimit-reset-requests'] || null;

        const useTokens = tokLimit > 0;
        const limit     = useTokens ? tokLimit     : reqLimit;
        const remaining = useTokens ? tokRemaining : reqRemaining;
        const unit      = useTokens ? 'tokens/min' : 'requests/min';
        const resetAt   = (useTokens ? tokReset : reqReset)
            ? new Date(Date.now() + this._parseDuration(useTokens ? tokReset : reqReset)).toISOString()
            : null;

        return {
            used: limit - remaining,
            limit,
            unit,
            resetsAt: resetAt,
            details: {
                tokenLimit: tokLimit,
                tokenRemaining: tokRemaining,
                requestLimit: reqLimit,
                requestRemaining: reqRemaining,
                note: 'Groq enforces limits at org level — reflects shared pool'
            }
        };
    }

    /**
     * Parse Groq's reset duration strings like "3s", "1m30s", "500ms".
     * Returns milliseconds.
     */
    _parseDuration(str) {
        if (!str) return 60000;
        let ms = 0;
        const minutes = str.match(/(\d+)m/);
        const seconds = str.match(/(\d+\.?\d*)s/);
        const millis  = str.match(/(\d+)ms/);
        if (minutes) ms += parseInt(minutes[1]) * 60000;
        if (seconds) ms += parseFloat(seconds[1]) * 1000;
        if (millis)  ms += parseInt(millis[1]);
        return ms || 60000;
    }
}

module.exports = GroqProvider;
