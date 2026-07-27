require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');

const app = express();
const server = http.createServer(app);

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MyZubster Gateway is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Token routes
const tokenRoutes = require('./routes/tokens');
app.use('/api/tokens', tokenRoutes);

// Order routes
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Monero routes
const moneroRoutes = require('./routes/monero');
app.use('/api/monero', moneroRoutes);

// User routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Bot routes (pubbliche per Telegram)
const botRoutes = require('./routes/bot');
app.use('/api/bot', botRoutes);

// Message routes (P2P Messaging)
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

// ===== WEBSOCKET SERVER =====
const WebSocketServer = require('./websocket/server');
const ws = new WebSocketServer(server);
app.set('websocket', ws);
console.log('✅ WebSocket server initialized');

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
