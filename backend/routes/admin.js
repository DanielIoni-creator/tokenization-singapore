const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');

// Simple admin route
router.get('/dashboard', authenticate, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard',
    data: {
      admin: req.user.username,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
