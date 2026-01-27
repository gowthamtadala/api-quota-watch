const axios = require('axios');

class GitHubProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.github.com';
    }

    async getQuota() {
        try {
            const response = await axios.get(
                `${this.baseURL}/rate_limit`,
                {
                    headers: {
                        'Authorization': `token ${this.apiKey}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            const core = response.data.resources.core;

            return {
                used: core.limit - core.remaining,
                limit: core.limit,
                unit: 'requests/hour',
                resetsAt: new Date(core.reset * 1000).toISOString(),
                details: {
                    search: response.data.resources.search,
                    graphql: response.data.resources.graphql
                }
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid GitHub token');
            }
            throw new Error(`GitHub API error: ${error.message}`);
        }
    }
}

module.exports = GitHubProvider;
