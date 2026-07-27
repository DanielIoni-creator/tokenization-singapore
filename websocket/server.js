const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const onlineUsers = new Map();

const initWebSocket = (server) => {
  const io = socketIO(server, { cors: { origin: '*', methods: ['GET','POST'] } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      socket.userRole = decoded.role || 'user';
      next();
    } catch (err) { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit('user-online', { userId: socket.userId });

    socket.on('send-message', async (data) => {
      try {
        const msg = await Message.create({
          sender: socket.userId, receiver: data.receiverId,
          orderId: data.orderId, groupId: data.groupId,
          content: data.content, attachments: data.attachments || [],
        });
        const populated = await Message.findById(msg._id).populate('sender','name').lean();
        if (data.receiverId) {
          const receiverSocket = onlineUsers.get(data.receiverId);
          if (receiverSocket) io.to(receiverSocket).emit('new-message', populated);
        }
        if (data.groupId) io.to(data.groupId).emit('new-message', populated);
        socket.emit('message-sent', populated);
      } catch (e) { socket.emit('message-error',{error:e.message}); }
    });

    socket.on('typing', (data) => {
      if (data.receiverId) {
        const r = onlineUsers.get(data.receiverId);
        if (r) io.to(r).emit('user-typing',{userId:socket.userId,typing:data.typing});
      }
    });

    socket.on('mark-read', async (data) => {
      if (data.messageId) {
        await Message.findByIdAndUpdate(data.messageId, { readAt: new Date() });
        const msg = await Message.findById(data.messageId);
        if (msg?.sender) {
          const s = onlineUsers.get(msg.sender.toString());
          if (s) io.to(s).emit('message-read',{messageId:data.messageId});
        }
      }
    });

    socket.on('join-group', (groupId) => { socket.join(groupId); });
    socket.on('leave-group', (groupId) => { socket.leave(groupId); });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('user-offline', { userId: socket.userId });
    });
  });

  return io;
};

module.exports = { initWebSocket, onlineUsers };
