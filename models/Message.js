const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  groupId: { type: String },
  content: { type: String, required: true, maxlength: 5000 },
  attachments: [{ name: String, url: String, type: String }],
  readAt: { type: Date },
  deletedAt: { type: Date },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ orderId: 1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
