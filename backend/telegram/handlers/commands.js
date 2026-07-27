const axios = require('axios');
const config = require('../config');

const userSubscriptions = new Map();

const formatNumber = (num) => {
  return new Intl.NumberFormat('it-IT').format(num);
};

exports.start = async (bot, msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name || 'User';
  
  const welcomeMessage = `
🏢 *Benvenuto su MyZubster Bot!* ${username}

💰 Investi in token immobiliari con Monero.

📌 *Comandi disponibili:*
/help - Mostra tutti i comandi
/stats - Statistiche in tempo reale
/tokens - Lista token disponibili
/price <symbol> - Prezzo di un token
/subscribe - Attiva notifiche
/unsubscribe - Disattiva notifiche

🔗 *Link utili:*
📱 GitHub: [github.com/DanielIoni-creator/tokenization-singapore](https://github.com/DanielIoni-creator/tokenization-singapore)
💬 Telegram: @myzubster
`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
};

exports.help = async (bot, msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📋 *Comandi MyZubster Bot*

📊 *Informazioni:*
/stats - Statistiche piattaforma
/tokens - Lista token disponibili
/price <symbol> - Prezzo token

🔔 *Notifiche:*
/subscribe - Attiva notifiche
/unsubscribe - Disattiva notifiche

🛠️ *Altro:*
/start - Benvenuto
/help - Questo messaggio

📱 *Link utili:*
GitHub: [link](https://github.com/DanielIoni-creator/tokenization-singapore)
Telegram: @myzubster
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
};

exports.stats = async (bot, msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${config.apiUrl}/bot/stats`);
    const stats = response.data.data;
    
    const statsMessage = `
📊 *Statistiche MyZubster*

🏢 *Token*
Totale: ${stats.totalTokens || 0}
Attivi: ${stats.activeTokens || 0}
Supply: ${formatNumber(stats.totalSupply || 0)}

💰 *Investimenti*
Raccolto: $${formatNumber(stats.totalRaised || 0)}
Investitori: ${stats.totalInvestors || 0}

📦 *Ordini*
Totali: ${stats.totalOrders || 0}
Completati: ${stats.completedOrders || 0}
In attesa: ${stats.pendingOrders || 0}

📈 *Performance*
Revenue: $${formatNumber(stats.totalRevenue || 0)}
Conversion: ${stats.conversionRate || 0}%
`;

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Errore stats:', error);
    bot.sendMessage(chatId, '❌ Errore nel recupero delle statistiche');
  }
};

exports.tokens = async (bot, msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${config.apiUrl}/bot/tokens`);
    const tokens = response.data.data;
    
    if (!tokens || tokens.length === 0) {
      bot.sendMessage(chatId, '📭 Nessun token disponibile al momento.');
      return;
    }
    
    let tokenMessage = '🏢 *Token Disponibili*\n\n';
    
    tokens.forEach((token, index) => {
      tokenMessage += `${index + 1}. *${token.name}* (${token.symbol})\n`;
      tokenMessage += `   💰 Prezzo: $${token.tokenPrice}\n`;
      tokenMessage += `   📊 Supply: ${formatNumber(token.totalSupply)}\n`;
      tokenMessage += `   📈 Status: ${token.status}\n\n`;
    });
    
    tokenMessage += 'Usa /price <symbol> per dettagli su un token specifico.';
    
    bot.sendMessage(chatId, tokenMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Errore tokens:', error);
    bot.sendMessage(chatId, '❌ Errore nel recupero dei token');
  }
};

exports.price = async (bot, msg, symbol) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${config.apiUrl}/bot/price/${symbol}`);
    const token = response.data.data;
    
    const priceMessage = `
💰 *${token.name}* (${token.symbol})

📊 *Dettagli*
Prezzo: $${token.tokenPrice}
Supply: ${formatNumber(token.totalSupply)}
Rimasti: ${formatNumber(token.remainingTokens)}
Raccolto: ${token.percentRaised || 0}%

🏢 *Proprietà*
Tipo: ${token.propertyDetails?.propertyType || 'N/A'}
Città: ${token.propertyDetails?.address?.city || 'Singapore'}
Valutazione: $${formatNumber(token.propertyDetails?.valuation || 0)}

📈 *Status*
${token.status === 'active' ? '✅ Attivo' : '⏸️ Non attivo'}
`;

    bot.sendMessage(chatId, priceMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Errore price:', error);
    bot.sendMessage(chatId, '❌ Token non trovato o errore nel recupero');
  }
};

exports.orders = async (bot, msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🔐 Per vedere i tuoi ordini, collegati all\'app. Questa funzionalità sarà disponibile a breve!');
};

exports.portfolio = async (bot, msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🔐 Per vedere il tuo portfolio, collegati all\'app. Questa funzionalità sarà disponibile a breve!');
};

exports.subscribe = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  userSubscriptions.set(userId, {
    chatId,
    subscribed: true,
    createdAt: new Date()
  });
  
  bot.sendMessage(chatId, '✅ Notifiche attivate! Riceverai aggiornamenti su ordini, prezzi e novità.');
};

exports.unsubscribe = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  userSubscriptions.delete(userId);
  
  bot.sendMessage(chatId, '❌ Notifiche disattivate. Non riceverai più aggiornamenti.');
};

exports.admin = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId.toString() !== config.adminChatId) {
    bot.sendMessage(chatId, '⛔ Comando riservato agli amministratori.');
    return;
  }
  
  const adminMessage = `
🛠️ *Pannello Admin*

📊 *Comandi disponibili:*
/broadcast <msg> - Invia messaggio a tutti
/stats - Statistiche dettagliate
/users - Numero utenti
/notify <orderId> - Notifica ordine
`;

  bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
};

exports.userSubscriptions = userSubscriptions;
