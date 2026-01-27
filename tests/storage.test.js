const Storage = require('../src/utils/storage');

describe('Storage', () => {
    beforeEach(() => {
        const apis = Storage.getAPIs();
        Object.keys(apis).forEach(provider => {
            Storage.removeAPI(provider);
        });
    });

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

    test('should save and retrieve quota history', () => {
        const quotaData = {
            used: 50,
            limit: 100,
            unit: 'USD'
        };

        Storage.saveQuotaHistory('openai', quotaData);
        const history = Storage.getQuotaHistory('openai');

        expect(history.length).toBe(1);
        expect(history[0].used).toBe(50);
    });

    test('should set and retrieve alerts', () => {
        Storage.setAlert('openai', 80, 'https://webhook.url');
        const alerts = Storage.getAlerts();

        expect(alerts.openai).toBeDefined();
        expect(alerts.openai.threshold).toBe(80);
    });
});
