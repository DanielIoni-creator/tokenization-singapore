// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cerca l'utente con isVerified true (invece di isActive)
    const user = await User.findOne({
      _id: decoded.id,
      isVerified: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or not verified'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required'
    });
  }
  next();
};

const isSuperAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin role required'
    });
  }
  next();
};

const isAccredited = async (req, res, next) => {
  if (!req.user || !req.user.isAccredited) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Accredited investor required'
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
