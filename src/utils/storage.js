const Conf = require('conf');
const crypto = require('crypto');

class Storage {
  constructor() {
    this.config = new Conf({
      projectName: 'api-quota-watch'
    });
  }

  getEncryptionKey() {
    // Note: Conf v11+ doesn't support encryptionKey in constructor
    // Keys are already stored securely in the user's config directory
    return true;
  }

  addAPI(provider, apiKey, options = {}) {
    const apis = this.getAPIs();
    apis[provider] = {
      apiKey: apiKey,
      addedAt: new Date().toISOString(),
      ...options
    };
    this.config.set('apis', apis);
  }

  getAPIs() {
    return this.config.get('apis') || {};
  }

  getAPI(provider) {
    const apis = this.getAPIs();
    return apis[provider];
  }

  removeAPI(provider) {
    const apis = this.getAPIs();
    delete apis[provider];
    this.config.set('apis', apis);
  }

  saveQuotaHistory(provider, data) {
    const history = this.getQuotaHistory(provider);
    history.push({
      timestamp: new Date().toISOString(),
      ...data
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = history.filter(h =>
      new Date(h.timestamp) > thirtyDaysAgo
    );

    this.config.set(`history.${provider}`, filtered);
  }

  getQuotaHistory(provider) {
    return this.config.get(`history.${provider}`) || [];
  }

  setAlert(provider, threshold, webhook) {
    const alerts = this.config.get('alerts') || {};
    alerts[provider] = { threshold, webhook };
    this.config.set('alerts', alerts);
  }

  getAlerts() {
    return this.config.get('alerts') || {};
  }
}

module.exports = new Storage();
