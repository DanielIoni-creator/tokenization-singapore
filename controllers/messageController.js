const Message = require('../models/Message');

// GET /api/messages/conversations - Get all user conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$recipient", userId] }, { $eq: ["$read", false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/messages/conversation/:userId - Get conversation with specific user
exports.getConversationWithUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: targetUserId },
        { sender: targetUserId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/messages/send - Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, content, orderId, attachments } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, error: "Recipient and content are required." });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      orderId: orderId || null,
      attachments: attachments || []
    });

    await message.save();
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/messages/read - Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.body;

    await Message.updateMany(
      { sender: senderId, recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, message: "Messages marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/messages/unread - Get total unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Message.countDocuments({ recipient: userId, read: false });

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/messages/:id - Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
