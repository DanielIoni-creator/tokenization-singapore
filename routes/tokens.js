'use strict';

const express = require('express');
const { getTokenBalance } = require('../controllers/tokenController');

const router = express.Router();

router.get('/balance/:walletAddress', getTokenBalance);

module.exports = router;