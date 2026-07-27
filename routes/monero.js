const express = require('express');
const router = express.Router();
const moneroController = require('../controllers/moneroController');

router.get('/balance', moneroController.getBalance);
router.post('/subaddress', moneroController.createSubaddress);
router.post('/send', moneroController.sendPayment);
router.get('/history', moneroController.getTransactionHistory);
router.get('/status', moneroController.getNodeStatus);

module.exports = router;
