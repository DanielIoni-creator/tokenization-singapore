require('dotenv').config({ path: __dirname + '/../.env' });
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const commandHandler = require('./handlers/commands');
const NotificationService = require('./services/notification');

// Usa il token dal config
const bot = new TelegramBot(config.botToken, { polling: true });
const notificationService = new NotificationService(bot);

console.log('🤖 Bot Telegram avviato!');

bot.onText(/\/start/, (msg) => {
  commandHandler.start(bot, msg);
});

bot.onText(/\/help/, (msg) => {
  commandHandler.help(bot, msg);
});

bot.onText(/\/stats/, (msg) => {
  commandHandler.stats(bot, msg);
});

bot.onText(/\/tokens/, (msg) => {
  commandHandler.tokens(bot, msg);
});

bot.onText(/\/orders/, (msg) => {
  commandHandler.orders(bot, msg);
});

bot.onText(/\/portfolio/, (msg) => {
  commandHandler.portfolio(bot, msg);
});

bot.onText(/\/price (.+)/, (msg, match) => {
  const symbol = match[1];
  commandHandler.price(bot, msg, symbol);
});

bot.onText(/\/subscribe/, (msg) => {
  commandHandler.subscribe(bot, msg);
});

bot.onText(/\/unsubscribe/, (msg) => {
  commandHandler.unsubscribe(bot, msg);
});

bot.onText(/\/admin/, (msg) => {
  commandHandler.admin(bot, msg);
});

bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  bot.sendMessage(msg.chat.id, '❓ Comando non riconosciuto.\nUsa /help per vedere i comandi disponibili.');
});

bot.on('error', (error) => {
  console.error('❌ Errore bot:', error);
});

module.exports = {
  bot,
  notificationService
};

console.log('✅ Bot Telegram pronto!');
