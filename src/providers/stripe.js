const axios = require('axios');

class StripeProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.stripe.com/v1';
    }

    async getQuota() {
        try {
            const response = await axios.get(
                `${this.baseURL}/balance`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            const headers = response.headers;
            const limit = parseInt(headers['stripe-rate-limit-limit'] || 100);
            const remaining = parseInt(headers['stripe-rate-limit-remaining'] || limit);
            const resetTimestamp = parseInt(headers['stripe-rate-limit-reset'] || 0);

            const used = limit - remaining;

            return {
                used: used,
                limit: limit,
                unit: 'requests/second',
                resetsAt: new Date(resetTimestamp * 1000).toISOString(),
                details: {
                    tier: this.detectTier(limit)
                }
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid Stripe API key');
            }
            throw new Error(`Stripe API error: ${error.message}`);
        }
    }

    detectTier(limit) {
        if (limit >= 100) return 'Standard (100 req/s)';
        if (limit >= 25) return 'Free (25 req/s)';
        return 'Unknown';
    }
}

module.exports = StripeProvider;
