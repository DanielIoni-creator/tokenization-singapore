const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

function initWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected to WebSocket: ${socket.userId}`);
    socket.join(socket.userId);

    socket.on('send-message', async (data) => {
      try {
        const { recipientId, content, orderId, group } = data;
        const msg = await Message.create({
          sender: socket.userId,
          recipient: recipientId || null,
          group: group || null,
          orderId: orderId || null,
          content,
          readBy: [socket.userId]
        });

        if (recipientId) {
          io.to(recipientId).emit('new-message', msg);
        }
        if (group) {
          io.to(group).emit('group-message', msg);
        }
        socket.emit('message-sent', msg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('typing', (data) => {
      if (data.recipientId) {
        io.to(data.recipientId).emit('user-typing', { userId: socket.userId });
      }
    });

    socket.on('join-group', (groupName) => {
      socket.join(groupName);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

module.exports = initWebSocket;
