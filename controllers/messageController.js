const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      deletedAt: null,
    }).sort({ createdAt: -1 }).populate('sender','name').populate('receiver','name').limit(100);
    const conversations = new Map();
    for (const m of messages) {
      const other = m.sender._id.equals(req.user._id) ? m.receiver : m.sender;
      const key = other?._id?.toString() || 'unknown';
      if (!conversations.has(key)) conversations.set(key, { user: other, lastMessage: m, unread: 0 });
      if (!m.readAt && m.receiver?._id?.equals(req.user._id)) conversations.get(key).unread++;
    }
    res.json({ conversations: Array.from(conversations.values()) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
      deletedAt: null,
    }).sort({ createdAt: 1 }).populate('sender','name').limit(200);
    res.json({ messages });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const msg = await Message.create({
      sender: req.user._id, receiver: req.body.receiverId,
      orderId: req.body.orderId, groupId: req.body.groupId,
      content: req.body.content, attachments: req.body.attachments || [],
    });
    res.status(201).json({ message: await msg.populate('sender','name') });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await Message.updateMany(
      { receiver: req.user._id, readAt: null, _id: { $in: req.body.messageIds || [req.body.messageId] } },
      { readAt: new Date() }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.messageId, sender: req.user._id },
      { deletedAt: new Date() }, { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
