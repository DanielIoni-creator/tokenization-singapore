// routes/monero.js
const express = require('express');
const router = express.Router();

// ===== GET MONERO STATUS =====
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'online',
        network: process.env.MONERO_NETWORK || 'testnet',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== GET MONERO BALANCE =====
router.get('/balance', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        balance: 0,
        unlockedBalance: 0,
        formatted: '0.0000 XMR'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== GET WALLET ADDRESS =====
router.get('/address', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        address: process.env.MONERO_WALLET_ADDRESS || 'Not configured'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
