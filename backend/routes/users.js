const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Get user profile (already in auth)
router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

module.exports = router;
