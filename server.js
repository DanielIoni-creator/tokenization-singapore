require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const messageRoutes = require('./routes/messages');
const tokenRoutes = require('./routes/tokens');
const orderRoutes = require('./routes/orders');
const initWebSocket = require('./websocket/server');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/messages', messageRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/orders', orderRoutes);

// Initialize WebSockets
const io = initWebSocket(server);

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tokenization-singapore';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Notice:', err.message));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server & WebSockets running on port ${PORT}`);
});
