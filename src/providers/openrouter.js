const axios = require('axios');

/**
 * OpenRouter Provider
 *
 * OpenRouter exposes a dedicated REST endpoint that returns true billing quota:
 *   GET /api/v1/key  →  { limit, limit_remaining, usage, ... }
 *
 * This is the best-quality quota data of any provider in this package:
 * - `limit`           : credit limit on this key (null = unlimited)
 * - `limit_remaining` : credits left before the key stops working
 * - `usage`           : total credits consumed by this key
 *
 * Credit unit: 1 credit ≈ $0.000001 USD  (so 1,000,000 credits = $1)
 * The provider normalises to USD for display consistency.
 */
class OpenRouterProvider {
    constructor(apiKey) {
        this.apiKey  = apiKey;
        this.baseURL = 'https://openrouter.ai/api/v1';
    }

    async getQuota() {
        let keyData;
        try {
            const res = await axios.get(
                `${this.baseURL}/key`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer':  'https://apiquotawatch.com',
                        'X-Title':       'api-quota-watch'
                    }
                }
            );
            keyData = res.data?.data || res.data;
        } catch (err) {
            if (err.response?.status === 401) throw new Error('Invalid OpenRouter API key');
            if (err.response?.status === 403) throw new Error('API key lacks permissions');
            throw new Error(`OpenRouter API error: ${err.message}`);
        }

        const usageCredits     = keyData.usage          ?? 0;
        const limitCredits     = keyData.limit          ?? null;   // null = no cap
        const remainingCredits = keyData.limit_remaining ?? null;

        // Convert credits → USD (1,000,000 credits = $1.00)
        const CREDITS_PER_USD = 1_000_000;

        if (limitCredits === null) {
            // No spending cap — show usage only
            return {
                used:  parseFloat((usageCredits / CREDITS_PER_USD).toFixed(4)),
                limit: 0,   // 0 = no limit (handled gracefully by formatter)
                unit:  'USD',
                resetsAt: null,
                details: {
                    note:           'No spending cap set on this key',
                    usageCredits,
                    rawKeyData:     keyData
                }
            };
        }

        const usedUSD      = parseFloat((usageCredits      / CREDITS_PER_USD).toFixed(4));
        const limitUSD     = parseFloat((limitCredits      / CREDITS_PER_USD).toFixed(4));
        const remainingUSD = parseFloat(((remainingCredits ?? 0) / CREDITS_PER_USD).toFixed(4));

        return {
            used:    usedUSD,
            limit:   limitUSD,
            unit:    'USD',
            resetsAt: null,   // OpenRouter credits don't auto-reset
            details: {
                remainingUSD,
                usageCredits,
                limitCredits,
                remainingCredits,
                isUnlimited: false,
                note: 'Credits do not auto-reset; set a new limit in OpenRouter dashboard'
            }
        };
    }
}

module.exports = OpenRouterProvider;
