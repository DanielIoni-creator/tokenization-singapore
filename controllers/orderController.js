const emailService = require('../utils/emailService');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { userEmail, tokenSymbol, quantity, totalAmountSGD, totalAmountXMR } = req.body;

    const orderDetails = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      userEmail,
      tokenSymbol: tokenSymbol || 'SQFT',
      quantity: quantity || 10,
      totalAmountSGD: totalAmountSGD || 1000,
      totalAmountXMR: totalAmountXMR || 0.45,
      paymentSubaddress: '888tXMR...' + Math.random().toString(36).substring(7)
    };

    // Trigger emails asynchronously
    emailService.sendOrderConfirmationEmail(userEmail, orderDetails);
    emailService.sendAdminNewOrderEmail('admin@tokenization.sg', orderDetails);

    res.status(201).json({ success: true, message: 'Order created & confirmation email sent.', order: orderDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/orders/:id/confirm-payment
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const orderDetails = { id };
    emailService.sendPaymentConfirmedEmail(userEmail, orderDetails);

    res.json({ success: true, message: 'Payment confirmed & notification email sent.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/orders/:id/complete
exports.completeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const orderDetails = { id };
    emailService.sendOrderCompletedEmail(userEmail, orderDetails);

    res.json({ success: true, message: 'Order completed & tokens transferred notification sent.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
