const Storage = require('../src/utils/storage');

describe('Storage', () => {
    // Clear ALL stored state before each test to prevent cross-test contamination
    beforeEach(() => {
        // Clear APIs
        const apis = Storage.getAPIs();
        Object.keys(apis).forEach(provider => Storage.removeAPI(provider));

        // Clear history for known test providers
        ['openai', 'anthropic', 'groq', 'mistral', 'openrouter', 'stripe', 'github'].forEach(p => {
            Storage.config.delete(`history.${p}`);
        });

        // Clear alerts
        Storage.config.delete('alerts');
    });

    // ── Core API CRUD ──────────────────────────────────────────────────────────

    test('should add and retrieve API', () => {
        Storage.addAPI('openai', 'sk-test123');
        const api = Storage.getAPI('openai');

        expect(api).toBeDefined();
        expect(api.apiKey).toBe('sk-test123');
    });

    test('should remove API', () => {
        Storage.addAPI('openai', 'sk-test123');
        Storage.removeAPI('openai');

        const api = Storage.getAPI('openai');
        expect(api).toBeUndefined();
    });

    // ── History ────────────────────────────────────────────────────────────────

    test('should save and retrieve quota history', () => {
        const quotaData = { used: 50, limit: 100, unit: 'USD' };

        Storage.saveQuotaHistory('openai', quotaData);
        const history = Storage.getQuotaHistory('openai');

        expect(history.length).toBe(1);
        expect(history[0].used).toBe(50);
        expect(history[0].timestamp).toBeDefined();
    });

    test('should return empty array for provider with no history', () => {
        const history = Storage.getQuotaHistory('groq');
        expect(history).toEqual([]);
    });

    // ── Alerts ─────────────────────────────────────────────────────────────────

    test('should set and retrieve alerts', () => {
        Storage.setAlert('openai', 80, 'https://hooks.slack.com/test');
        const alerts = Storage.getAlerts();

        expect(alerts.openai).toBeDefined();
        expect(alerts.openai.threshold).toBe(80);
        expect(alerts.openai.webhook).toBe('https://hooks.slack.com/test');
    });

    // ── Burn rate ─────────────────────────────────────────────────────────────

    test('should return null burn rate with fewer than 2 history entries', () => {
        Storage.saveQuotaHistory('openai', { used: 50, limit: 100 });
        expect(Storage.getBurnRate('openai')).toBeNull();
    });

    test('should calculate burn rate from history', () => {
        // Simulate two readings 24 hours apart
        const now = new Date();
        const yesterday = new Date(now - 24 * 60 * 60 * 1000);

        Storage.config.set('history.openai', [
            { timestamp: yesterday.toISOString(), used: 10, limit: 100 },
            { timestamp: now.toISOString(),       used: 20, limit: 100 }
        ]);

        const rate = Storage.getBurnRate('openai');
        expect(rate).not.toBeNull();
        expect(rate.dailyRate).toBeCloseTo(10, 0); // ~10 units/day
    });

    // ── Report data ───────────────────────────────────────────────────────────

    test('should build report data from cached history', () => {
        Storage.addAPI('openai', 'sk-test', { alias: 'my-openai' });
        Storage.saveQuotaHistory('openai', { used: 40, limit: 100, unit: 'USD' });

        const report = Storage.getReportData({});

        expect(report.reporter).toBeDefined();
        expect(report.reportedAt).toBeDefined();
        expect(report.apis.length).toBe(1);
        expect(report.apis[0].provider).toBe('openai');
        expect(report.apis[0].alias).toBe('my-openai');
        expect(report.apis[0].usedPercent).toBeCloseTo(40, 1);
    });

    test('should prefer live data over cached history in report', () => {
        Storage.addAPI('openai', 'sk-test', { alias: 'openai' });
        Storage.saveQuotaHistory('openai', { used: 10, limit: 100, unit: 'USD' });

        const liveQuota = { used: 75, limit: 100, unit: 'USD', resetsAt: null };
        const report = Storage.getReportData({ openai: liveQuota });

        expect(report.apis[0].used).toBe(75);
        expect(report.apis[0].dataSource).toBe('live');
    });
});
