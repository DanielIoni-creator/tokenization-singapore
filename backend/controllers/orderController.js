// backend/controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Token = require('../models/Token');
const email = require('../services/emailService');

// --- helpers ---------------------------------------------------------------
function userEmailOf(order, req) {
  if (order.userId && typeof order.userId === 'object' && order.userId.email) {
    return order.userId.email;
  }
  return req.user && req.user.email;
}

// Fire an email hook but never let it break the request path.
async function safeHook(fn, order, req) {
  try {
    if (order) await fn(order, userEmailOf(order, req));
  } catch (err) {
    console.error('[orderController] email hook failed:', err.message);
  }
}

// --- read routes (existing) ------------------------------------------------
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('tokenId', 'name symbol')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tokenId', 'name symbol')
      .populate('userId', 'username email');
    if (!order) {
      return res.status(404).json({ success: false, message: req.t('orders.confirm.not_found') });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// --- lifecycle routes (added for #2) ---------------------------------------
// POST /api/orders  -> create an order, notify user + admin by email
exports.createOrder = async (req, res, next) => {
  try {
    const { tokenId, amount, paymentMethod } = req.body;
    if (!tokenId || !amount) {
      return res.status(400).json({ success: false, message: 'tokenId and amount are required' });
    }
    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const order = new Order({
      userId: req.user.id,
      tokenId,
      amount: Number(amount),
      totalPrice: Number(amount) * (token.tokenPrice || 1),
      paymentMethod: paymentMethod || 'monero',
      status: 'pending',
      paymentStatus: 'pending',
      // placeholder subaddress; replace with real monero subaddress generation
      moneroSubaddress: process.env.MONERO_WALLET_ADDRESS || 'pending',
    });
    await order.save();

    await safeHook(email.notifyNewOrder, order, req);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/:id/confirm-payment -> mark paid, notify user by email
exports.confirmPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.paymentStatus = 'completed';
    order.status = 'processing';
    order.moneroTxHash = req.body.txHash || order.moneroTxHash;
    order.paidAt = new Date();
    await order.save();

    await safeHook(email.notifyPaymentConfirmed, order, req);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/:id/complete -> mark completed (tokens minted), notify user + admin
exports.completeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.status = 'completed';
    order.paymentStatus = 'completed';
    order.completedAt = new Date();
    await order.save();

    await safeHook(email.notifyOrderCompleted, order, req);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
