const Message = require('../models/Message');

exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.getConversationWithUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: targetUserId },
        { sender: targetUserId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, orderId, group } = req.body;
    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId || null,
      group: group || null,
      orderId: orderId || null,
      content,
      readBy: [req.user.id]
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      readBy: { $ne: req.user.id }
    });
    res.json({ success: true, unreadCount: count });
  } catch (err) {
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};
