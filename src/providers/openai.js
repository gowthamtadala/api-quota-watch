const axios = require('axios');

class OpenAIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openai.com/v1';
    }

    async getQuota() {
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

            const used = response.data.total_usage / 100;
            const limit = subscription.data.hard_limit_usd || 100;

            return {
                used: used,
                limit: limit,
                unit: 'USD',
                resetsAt: this.getNextMonthDate(),
                details: {
                    daily_usage: response.data.daily_costs || []
                }
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenAI API key');
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
