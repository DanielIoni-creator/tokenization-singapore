// telegram/bot.js
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const commandHandler = require('./handlers/commands');
const messageHandler = require('./handlers/messages');
const notificationService = require('./services/notification');

// Inizializza il bot
const bot = new TelegramBot(config.botToken, { polling: true });

console.log('🤖 Bot Telegram avviato!');

// ===== COMANDI =====

// /start
bot.onText(/\/start/, (msg) => {
  commandHandler.start(bot, msg);
});

// /help
bot.onText(/\/help/, (msg) => {
  commandHandler.help(bot, msg);
});

// /stats
bot.onText(/\/stats/, (msg) => {
  commandHandler.stats(bot, msg);
});

// /tokens
bot.onText(/\/tokens/, (msg) => {
  commandHandler.tokens(bot, msg);
});

// /orders
bot.onText(/\/orders/, (msg) => {
  commandHandler.orders(bot, msg);
});

// /portfolio
bot.onText(/\/portfolio/, (msg) => {
  commandHandler.portfolio(bot, msg);
});

// /price [symbol]
bot.onText(/\/price (.+)/, (msg, match) => {
  const symbol = match[1];
  commandHandler.price(bot, msg, symbol);
});

// /subscribe
bot.onText(/\/subscribe/, (msg) => {
  commandHandler.subscribe(bot, msg);
});

// /unsubscribe
bot.onText(/\/unsubscribe/, (msg) => {
  commandHandler.unsubscribe(bot, msg);
});

// /admin (solo per admin)
bot.onText(/\/admin/, (msg) => {
  commandHandler.admin(bot, msg);
});

// ===== MESSAGGI =====

// Gestione messaggi generici
bot.on('message', (msg) => {
  // Ignora i comandi
  if (msg.text && msg.text.startsWith('/')) return;
  
  messageHandler.handleMessage(bot, msg);
});

// ===== ERRORI =====

bot.on('error', (error) => {
  console.error('❌ Errore bot:', error);
});

// ===== NOTIFICHE =====

// Esporta il bot per le notifiche
module.exports = {
  bot,
  notificationService
};
