// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['monero', 'ethereum', 'bank-transfer'],
    default: 'monero'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  moneroSubaddress: { type: String },
  moneroTxHash: { type: String },
  status: {
    type: String,
    enum: ['pending', 'awaiting-payment', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
