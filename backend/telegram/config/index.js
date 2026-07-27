require('dotenv').config();

module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  botUsername: process.env.TELEGRAM_BOT_USERNAME || 'MyZubsterBot',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  
  commands: {
    start: '/start - Benvenuto e informazioni',
    help: '/help - Aiuto e comandi disponibili',
    stats: '/stats - Statistiche in tempo reale',
    tokens: '/tokens - Lista token disponibili',
    orders: '/orders - I tuoi ordini recenti',
    portfolio: '/portfolio - Il tuo portfolio',
    price: '/price <symbol> - Prezzo di un token',
    subscribe: '/subscribe - Attiva notifiche',
    unsubscribe: '/unsubscribe - Disattiva notifiche',
    admin: '/admin - Comandi admin (solo per admin)',
  },
  
  messages: {
    welcome: 'Benvenuto su MyZubster Bot! 🏢\n\nInvesti in token immobiliari con Monero.\nUsa /help per vedere i comandi.',
    help: '📋 Comandi disponibili:\n\n',
    error: '❌ Si è verificato un errore. Riprova più tardi.',
    notFound: '❌ Comando non trovato. Usa /help per vedere i comandi disponibili.',
  }
};
