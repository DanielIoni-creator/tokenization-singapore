// backend/controllers/orderController.js
const Order = require('../models/Order');
const email = require('../services/emailService');

// Pull the user's email from the populated order (or req.user).
function userEmailOf(order, req) {
  if (order.userId && typeof order.userId === 'object' && order.userId.email) {
    return order.userId.email;
  }
  return req.user && req.user.email;
}

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('tokenId', 'name symbol')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
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
      return res.status(404).json({
        success: false,
        message: req.t('orders.confirm.not_found'),
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Called after an order is created (e.g. from your orders route / bot flow).
// `req.order` is the saved Order document.
exports.afterOrderCreated = async (req, res, next) => {
  try {
    const order = req.order;
    if (order) {
      await email.notifyNewOrder(order, userEmailOf(order, req));
    }
  } catch (error) {
    console.error('[orderController] afterOrderCreated email failed:', error.message);
  }
  next();
};

// Called after payment is confirmed (e.g. from monero webhook).
exports.afterPaymentConfirmed = async (req, res, next) => {
  try {
    const order = req.order;
    if (order) {
      await email.notifyPaymentConfirmed(order, userEmailOf(order, req));
    }
  } catch (error) {
    console.error('[orderController] afterPaymentConfirmed email failed:', error.message);
  }
  next();
};

// Called after an order is completed (tokens minted).
exports.afterOrderCompleted = async (req, res, next) => {
  try {
    const order = req.order;
    if (order) {
      await email.notifyOrderCompleted(order, userEmailOf(order, req));
    }
  } catch (error) {
    console.error('[orderController] afterOrderCompleted email failed:', error.message);
  }
  next();
};
