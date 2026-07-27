const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

router.get('/balance/:walletAddress', tokenController.getWalletBalances);

module.exports = router;
