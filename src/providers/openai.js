const axios = require('axios');

class OpenAIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openai.com/v1';
    }

    async getQuota() {
        try {
            // First, validate the API key works by listing models (no special permissions needed)
            await axios.get(
                `${this.baseURL}/models`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            // Try to get billing info (may fail if key doesn't have billing permissions)
            let used = 0;
            let limit = 100;

            try {
                const response = await axios.get(
                    `${this.baseURL}/dashboard/billing/usage`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        params: {
                            start_date: this.getFirstDayOfMonth(),
                            end_date: this.getCurrentDate()
                        }
                    }
                );

                const subscription = await axios.get(
                    `${this.baseURL}/dashboard/billing/subscription`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`
                        }
                    }
                );

                used = response.data.total_usage / 100;
                limit = subscription.data.hard_limit_usd || 100;
            } catch (billingError) {
                // If billing API fails, return placeholder data
                // The key is still valid (models API worked)
                return {
                    used: 0,
                    limit: 0,
                    unit: 'USD',
                    resetsAt: this.getNextMonthDate(),
                    details: {
                        note: 'Billing API access required for quota monitoring. Key is valid but cannot access usage data.'
                    }
                };
            }

            return {
                used: used,
                limit: limit,
                unit: 'USD',
                resetsAt: this.getNextMonthDate(),
                details: {
                    daily_usage: []
                }
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenAI API key');
            }
            if (error.response?.status === 403) {
                throw new Error('API key does not have required permissions');
            }
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    getFirstDayOfMonth() {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1)
            .toISOString().split('T')[0];
    }

    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    getNextMonthDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        return date.toISOString();
    }
}

module.exports = OpenAIProvider;
