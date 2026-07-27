// controllers/tokenController.js
const Token = require('../models/Token');

exports.getAllTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

exports.getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: req.t('tokens.deploy.not_found')
      });
    }
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    next(error);
  }
};
