const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Order = require('../models/Order');
const User = require('../models/User');

// Endpoint pubblico per il bot - Lista token
router.get('/tokens', async (req, res) => {
  try {
    const tokens = await Token.find({ status: 'active' })
      .select('name symbol tokenPrice totalSupply status propertyDetails')
      .lean();

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Errore bot tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei token'
    });
  }
});

// Endpoint per le statistiche del bot
router.get('/stats', async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    const activeTokens = await Token.countDocuments({ status: 'active' });

    const supplyResult = await Token.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSupply' } } }
    ]);
    const totalSupply = supplyResult.length > 0 ? supplyResult[0].total : 0;

    const totalInvestors = await User.countDocuments({ role: 'investor' });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'awaiting-payment'] }
    });

    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const raisedResult = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRaised = raisedResult.length > 0 ? raisedResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalTokens,
        activeTokens,
        totalSupply,
        totalInvestors,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        totalRaised,
        conversionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Errore bot stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
});

// Endpoint per il prezzo di un token
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const token = await Token.findOne({
      symbol: symbol.toUpperCase(),
      status: 'active'
    }).lean();

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token non trovato'
      });
    }

    const orders = await Order.find({ tokenId: token._id, status: 'completed' });
    const totalSold = orders.reduce((sum, o) => sum + o.amount, 0);
    const remainingTokens = token.totalSupply - totalSold;
    const percentRaised = token.totalSupply > 0 ? ((totalSold / token.totalSupply) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        ...token,
        totalSold,
        remainingTokens,
        percentRaised,
        totalInvestors: orders.length
      }
    });
  } catch (error) {
    console.error('Errore bot price:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del prezzo'
    });
  }
});

module.exports = router;
