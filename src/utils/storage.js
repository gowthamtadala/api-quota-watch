const Conf   = require('conf');
const os     = require('os');

class Storage {
    constructor() {
        this.config = new Conf({
            projectName: 'api-quota-watch'
        });
    }

    // ─── APIs ────────────────────────────────────────────────────────────────

    addAPI(provider, apiKey, options = {}) {
        const apis      = this.getAPIs();
        apis[provider]  = {
            apiKey,
            addedAt: new Date().toISOString(),
            ...options
        };
        this.config.set('apis', apis);
    }

    getAPIs() {
        return this.config.get('apis') || {};
    }

    getAPI(provider) {
        return this.getAPIs()[provider];
    }

    removeAPI(provider) {
        const apis = this.getAPIs();
        delete apis[provider];
        this.config.set('apis', apis);
    }

    // ─── History ─────────────────────────────────────────────────────────────

    saveQuotaHistory(provider, data) {
        const history = this.getQuotaHistory(provider);
        history.push({ timestamp: new Date().toISOString(), ...data });

        // Keep 30 days rolling window
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filtered = history.filter(h => new Date(h.timestamp) > thirtyDaysAgo);

        this.config.set(`history.${provider}`, filtered);
    }

    getQuotaHistory(provider) {
        return this.config.get(`history.${provider}`) || [];
    }

    // ─── Alerts ──────────────────────────────────────────────────────────────

    setAlert(provider, threshold, webhook) {
        const alerts   = this.config.get('alerts') || {};
        alerts[provider] = { threshold, webhook };
        this.config.set('alerts', alerts);
    }

    getAlerts() {
        return this.config.get('alerts') || {};
    }

    // ─── Burn rate ────────────────────────────────────────────────────────────

    /**
     * Calculate the burn rate for a provider based on stored history.
     * Returns daily usage rate, or null if insufficient data.
     */
    getBurnRate(provider) {
        const history = this.getQuotaHistory(provider);
        if (history.length < 2) return null;

        const recent  = history.slice(-7);
        const oldest  = recent[0];
        const newest  = recent[recent.length - 1];

        const deltaUsed = newest.used - oldest.used;
        const deltaMs   = new Date(newest.timestamp) - new Date(oldest.timestamp);
        const deltaDays = deltaMs / (1000 * 60 * 60 * 24);

        if (deltaUsed <= 0 || deltaDays <= 0) return null;

        return {
            dailyRate: deltaUsed / deltaDays,
            sampledFrom: oldest.timestamp,
            sampledTo:   newest.timestamp
        };
    }

    // ─── Report data ──────────────────────────────────────────────────────────

    /**
     * Aggregate all APIs + latest history into the canonical report schema.
     * This is the foundation for team aggregation / future dashboard upload.
     */
    getReportData(liveQuotas = {}) {
        const apis    = this.getAPIs();
        const apiRows = [];

        for (const [provider, config] of Object.entries(apis)) {
            const live      = liveQuotas[provider] || null;
            const history   = this.getQuotaHistory(provider);
            const latest    = live || (history.length > 0 ? history[history.length - 1] : null);

            if (!latest) continue;

            const usedPercent = latest.limit > 0
                ? (latest.used / latest.limit) * 100
                : 0;

            apiRows.push({
                provider,
                alias:       config.alias || provider,
                usedPercent,
                used:        latest.used,
                limit:       latest.limit,
                unit:        latest.unit || '',
                resetsAt:    latest.resetsAt || null,
                dataSource:  live ? 'live' : 'cached',
                cachedAt:    live ? null : (history.length > 0 ? history[history.length - 1].timestamp : null)
            });
        }

        return {
            reportedAt: new Date().toISOString(),
            reporter:   os.hostname(),
            version:    require('../../package.json').version,
            apis:       apiRows
        };
    }

    // ─── Team config ──────────────────────────────────────────────────────────

    setTeamConfig(name, webhookUrl) {
        this.config.set('team', { name, webhookUrl });
    }

    getTeamConfig() {
        return this.config.get('team') || null;
    }
}

module.exports = new Storage();
