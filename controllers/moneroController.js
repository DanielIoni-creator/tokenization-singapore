const moneroService = require('../utils/moneroService');

exports.getBalance = async (req, res) => {
  try {
    const data = await moneroService.getBalance();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubaddress = async (req, res) => {
  try {
    const { label } = req.body;
    const subaddress = await moneroService.createSubaddress(label);
    res.json({ success: true, subaddress });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sendPayment = async (req, res) => {
  try {
    const { recipientAddress, amount } = req.body;
    const tx = await moneroService.sendPayment(recipientAddress, amount);
    res.json({ success: true, transaction: tx });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const history = await moneroService.getTransactionHistory();
    res.json({ success: true, transactions: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNodeStatus = async (req, res) => {
  try {
    const status = await moneroService.getNodeStatus();
    res.json({ success: true, nodeStatus: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
