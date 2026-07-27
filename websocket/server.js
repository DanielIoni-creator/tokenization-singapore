const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

function initWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(userId);
    console.log(`User connected to WebSocket: ${userId}`);

    // Listen for sending real-time message
    socket.on("send-message", async (data) => {
      try {
        const { recipientId, content, orderId, attachments } = data;

        const message = new Message({
          sender: userId,
          recipient: recipientId,
          content,
          orderId: orderId || null,
          attachments: attachments || []
        });

        await message.save();

        // Emit to recipient & sender
        io.to(recipientId).emit("new-message", message);
        io.to(userId).emit("message-sent", message);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Listen for typing indicator
    socket.on("typing", (data) => {
      io.to(data.recipientId).emit("user-typing", { senderId: userId });
    });

    // Listen for mark-read event
    socket.on("mark-read", async (data) => {
      await Message.updateMany(
        { sender: data.senderId, recipient: userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      io.to(data.senderId).emit("messages-read", { readBy: userId });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}

module.exports = initWebSocket;
