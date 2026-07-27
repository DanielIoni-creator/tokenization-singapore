const { userSubscriptions } = require('../handlers/commands');
const config = require('../config');

class NotificationService {
  constructor(bot) {
    this.bot = bot;
  }

  async broadcastToAll(message, parseMode = 'Markdown') {
    let count = 0;
    
    for (const [userId, subscription] of userSubscriptions) {
      if (subscription.subscribed) {
        try {
          await this.bot.sendMessage(subscription.chatId, message, { parse_mode: parseMode });
          count++;
        } catch (error) {
          console.error(`Errore invio a ${userId}:`, error);
        }
      }
    }
    
    console.log(`📨 Notifica inviata a ${count} utenti`);
    return count;
  }

  async notifyUser(userId, message, parseMode = 'Markdown') {
    try {
      await this.bot.sendMessage(userId, message, { parse_mode: parseMode });
      return true;
    } catch (error) {
      console.error(`Errore invio a ${userId}:`, error);
      return false;
    }
  }

  async notifyNewOrder(order) {
    const message = `
🆕 *Nuovo Ordine!*

📦 *Ordine #${order._id.slice(-6)}*
👤 Utente: ${order.userId}
🏢 Token: ${order.tokenId?.name || 'N/A'}
💰 Importo: $${order.totalPrice}
📊 Status: ${order.status}

🔗 Dettagli: ${config.apiUrl}/orders/${order._id}
`;

    await this.broadcastToAll(message);
    
    if (config.adminChatId) {
      await this.notifyUser(config.adminChatId, message);
    }
  }

  async notifyPaymentConfirmed(order) {
    const message = `
✅ *Pagamento Confermato!*

💰 Ordine #${order._id.slice(-6)}
📦 Token: ${order.tokenId?.name || 'N/A'}
💵 Importo: $${order.totalPrice}
🔗 Tx: ${order.moneroTxHash || 'N/A'}

Lo status dell'ordine è stato aggiornato a "processing".
`;

    await this.broadcastToAll(message);
  }

  async notifyOrderCompleted(order) {
    const message = `
🎉 *Ordine Completato!*

✅ Ordine #${order._id.slice(-6)}
🏢 Token: ${order.tokenId?.name || 'N/A'}
💰 Importo: $${order.totalPrice}
📅 Completato: ${new Date().toLocaleDateString()}

I tuoi token sono stati mintati! 🪙
`;

    await this.broadcastToAll(message);
  }

  async notifyNewToken(token) {
    const message = `
🆕 *Nuovo Token Disponibile!*

🏢 *${token.name}* (${token.symbol})
💰 Prezzo: $${token.tokenPrice}
📊 Supply: ${token.totalSupply}
🏙️ Città: ${token.propertyDetails?.address?.city || 'Singapore'}

Inizia a investire ora! 🚀
`;

    await this.broadcastToAll(message);
  }

  async notifyPriceUpdate(token, oldPrice, newPrice) {
    const change = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
    const direction = change >= 0 ? '📈' : '📉';
    
    const message = `
${direction} *Aggiornamento Prezzo*

🏢 *${token.name}* (${token.symbol})
💰 Prezzo: $${newPrice}
📊 Variazione: ${change}%

Ultimo aggiornamento: ${new Date().toLocaleTimeString()}
`;

    await this.broadcastToAll(message);
  }
}

module.exports = NotificationService;
