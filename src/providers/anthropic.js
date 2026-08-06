const axios = require('axios');

class AnthropicProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1';
    }

    async getQuota() {
        try {
            // Make a minimal messages request to get rate-limit headers back.
            // We use max_tokens=1 to keep cost near zero.
            let rateLimitHeaders = {};
            try {
                await axios.post(
                    `${this.baseURL}/messages`,
                    {
                        model: 'claude-opus-4-5',
                        max_tokens: 1,
                        messages: [{ role: 'user', content: 'ping' }]
                    },
                    {
                        headers: {
                            'x-api-key': this.apiKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        }
                    }
                );
            } catch (err) {
                // Even on error responses (e.g. overloaded) Anthropic returns headers
                if (err.response && err.response.headers) {
                    rateLimitHeaders = err.response.headers;
                } else {
                    throw err;
                }
            }

            // Parse request-level rate limits
            const reqLimit     = parseInt(rateLimitHeaders['anthropic-ratelimit-requests-limit']     || 0);
            const reqRemaining = parseInt(rateLimitHeaders['anthropic-ratelimit-requests-remaining'] || reqLimit);
            const reqReset     = rateLimitHeaders['anthropic-ratelimit-requests-reset']  || null;

            // Parse token-level rate limits (higher resolution signal)
            const tokLimit     = parseInt(rateLimitHeaders['anthropic-ratelimit-tokens-limit']     || 0);
            const tokRemaining = parseInt(rateLimitHeaders['anthropic-ratelimit-tokens-remaining'] || tokLimit);
            const tokReset     = rateLimitHeaders['anthropic-ratelimit-tokens-reset'] || reqReset;

            // Prefer token limits when available (more meaningful for AI spend)
            const useTokens = tokLimit > 0;
            const limit     = useTokens ? tokLimit     : reqLimit;
            const remaining = useTokens ? tokRemaining : reqRemaining;
            const unit      = useTokens ? 'tokens/min' : 'requests/min';
            const resetAt   = tokReset  ? new Date(tokReset).toISOString() : null;

            return {
                used: limit - remaining,
                limit,
                unit,
                resetsAt: resetAt,
                details: {
                    requestLimit: reqLimit,
                    requestRemaining: reqRemaining,
                    tokenLimit: tokLimit,
                    tokenRemaining: tokRemaining
                }
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid Anthropic API key');
            }
            if (error.response?.status === 403) {
                throw new Error('API key does not have the required permissions');
            }
            throw new Error(`Anthropic API error: ${error.message}`);
        }
    }
}

module.exports = AnthropicProvider;
