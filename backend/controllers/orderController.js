// controllers/orderController.js
const Order = require('../models/Order');

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('tokenId', 'name symbol')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
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
        message: req.t('orders.confirm.not_found')
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
