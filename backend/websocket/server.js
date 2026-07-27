// websocket/server.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

class WebSocketServer {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.authenticatedSockets = new Map();
    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.username}`);
      this.authenticatedSockets.set(socket.user._id.toString(), socket.id);
      socket.join(`user:${socket.user._id}`);

      // Send message
      socket.on('send-message', async (data) => {
        try {
          const { recipientId, orderId, content, type = 'text' } = data;

          const message = new Message({
            sender: socket.user._id,
            recipient: recipientId,
            order: orderId,
            content,
            type,
            status: 'sent',
            createdAt: new Date()
          });

          await message.save();
          await message.populate('sender', 'username fullName');
          await message.populate('recipient', 'username fullName');

          socket.emit('message-sent', message);

          const recipientSocketId = this.authenticatedSockets.get(recipientId);
          if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('new-message', message);
            message.status = 'delivered';
            await message.save();
          }

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message-error', { error: error.message });
        }
      });

      // Mark as read
      socket.on('mark-read', async (data) => {
        try {
          const { messageIds } = data;
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { status: 'read', readAt: new Date() }
          );

          const messages = await Message.find({ _id: { $in: messageIds } });
          for (const msg of messages) {
            const senderSocketId = this.authenticatedSockets.get(msg.sender.toString());
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('message-read', {
                messageId: msg._id,
                readerId: socket.user._id
              });
            }
          }

        } catch (error) {
          console.error('Error marking read:', error);
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        const { recipientId, isTyping } = data;
        const recipientSocketId = this.authenticatedSockets.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user-typing', {
            userId: socket.user._id,
            username: socket.user.username,
            isTyping
          });
        }
      });

      // Join order room
      socket.on('join-order-room', (data) => {
        const { orderId } = data;
        socket.join(`order:${orderId}`);
      });

      // Get conversation
      socket.on('get-conversation', async (data) => {
        try {
          const { userId, limit = 50, before } = data;
          
          const query = {
            $or: [
              { sender: socket.user._id, recipient: userId },
              { sender: userId, recipient: socket.user._id }
            ],
            isDeleted: false
          };

          if (before) {
            query.createdAt = { $lt: before };
          }

          const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'username fullName')
            .populate('recipient', 'username fullName');

          socket.emit('conversation-history', {
            messages: messages.reverse(),
            hasMore: messages.length === limit
          });

        } catch (error) {
          console.error('Error getting conversation:', error);
          socket.emit('conversation-error', { error: error.message });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.user.username}`);
        this.authenticatedSockets.delete(socket.user._id.toString());
      });
    });
  }

  async notifyUser(userId, event, data) {
    const socketId = this.authenticatedSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }
}

module.exports = WebSocketServer;
