// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: req.t ? req.t('errors.unauthorized') : 'Authentication required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: req.t ? req.t('errors.unauthorized') : 'User not found or inactive'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: req.t ? req.t('errors.unauthorized') : 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: req.t ? req.t('errors.unauthorized') : 'Token expired'
      });
    }
    res.status(500).json({
      success: false,
      message: req.t ? req.t('errors.internal_server') : 'Authentication error'
    });
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      message: req.t ? req.t('errors.forbidden') : 'Access denied: Admin role required'
    });
  }
  next();
};

const isSuperAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: req.t ? req.t('errors.forbidden') : 'Access denied: Super Admin role required'
    });
  }
  next();
};

const isAccredited = async (req, res, next) => {
  if (!req.user || !req.user.isAccredited) {
    return res.status(403).json({
      success: false,
      message: req.t ? req.t('errors.forbidden') : 'Access denied: Accredited investor required'
    });
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  isSuperAdmin,
  isAccredited
};
