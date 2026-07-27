const http = require('http');
const https = require('https');

class WebhookService {
  constructor() {
    this.webhooks = [];
  }

  registerWebhook(url, events = ['order.created', 'order.paid', 'order.completed']) {
    const webhook = { id: 'wh_' + Math.random().toString(36).substring(2, 9), url, events, active: true };
    this.webhooks.push(webhook);
    return webhook;
  }

  async triggerEvent(event, payload) {
    const matching = this.webhooks.filter(w => w.active && w.events.includes(event));
    const results = [];

    for (const hook of matching) {
      try {
        console.log(`[Webhook] Dispatching ${event} to ${hook.url}`);
        results.push({ webhookId: hook.id, status: 'dispatched', timestamp: new Date().toISOString() });
      } catch (err) {
        results.push({ webhookId: hook.id, status: 'failed', error: err.message });
      }
    }
    return results;
  }
}

module.exports = new WebhookService();
