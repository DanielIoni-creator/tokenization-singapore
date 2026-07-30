const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticate } = require('../middleware/auth');

// Routes
router.get('/', authenticate, tokenController.getAllTokens);
router.get('/balance/:walletAddress', authenticate, tokenController.getWalletBalance);
router.get('/:id', authenticate, tokenController.getTokenById);

module.exports = router;