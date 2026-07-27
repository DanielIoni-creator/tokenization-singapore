const nodemailer = require('nodemailer');

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || 'sample_user',
    pass: process.env.SMTP_PASS || 'sample_pass'
  }
});

// 1. Order Confirmation Email (User)
exports.sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
  const mailOptions = {
    from: '"Singapore Real Estate Tokenization" <no-reply@tokenization.sg>',
    to: userEmail,
    subject: `Order Confirmation - Order #${orderDetails.id}`,
    html: `
      <h2>Order Confirmation</h2>
      <p>Thank you for your real estate token investment!</p>
      <p><strong>Order ID:</strong> ${orderDetails.id}</p>
      <p><strong>Token:</strong> ${orderDetails.tokenSymbol}</p>
      <p><strong>Quantity:</strong> ${orderDetails.quantity}</p>
      <p><strong>Total Amount:</strong> ${orderDetails.totalAmountSGD} SGD (${orderDetails.totalAmountXMR} XMR)</p>
      <p><strong>Payment Subaddress:</strong> <code>${orderDetails.paymentSubaddress}</code></p>
    `
  };
  return transporter.sendMail(mailOptions).catch(err => console.log('Mail Log:', err.message));
};

// 2. New Order Notification (Admin)
exports.sendAdminNewOrderEmail = async (adminEmail, orderDetails) => {
  const mailOptions = {
    from: '"Platform System" <system@tokenization.sg>',
    to: adminEmail || 'admin@tokenization.sg',
    subject: `🚨 New Order Created - #${orderDetails.id}`,
    html: `
      <h2>New Investment Order Received</h2>
      <p><strong>User:</strong> ${orderDetails.userEmail}</p>
      <p><strong>Order ID:</strong> ${orderDetails.id}</p>
      <p><strong>Amount:</strong> ${orderDetails.totalAmountSGD} SGD</p>
    `
  };
  return transporter.sendMail(mailOptions).catch(err => console.log('Mail Log:', err.message));
};

// 3. Payment Confirmed Email (User)
exports.sendPaymentConfirmedEmail = async (userEmail, orderDetails) => {
  const mailOptions = {
    from: '"Singapore Real Estate Tokenization" <no-reply@tokenization.sg>',
    to: userEmail,
    subject: `Payment Confirmed - Order #${orderDetails.id}`,
    html: `
      <h2>Payment Confirmed</h2>
      <p>We have successfully received your Monero payment for Order #${orderDetails.id}. Your tokens are being processed.</p>
    `
  };
  return transporter.sendMail(mailOptions).catch(err => console.log('Mail Log:', err.message));
};

// 4. Order Completed Email (User)
exports.sendOrderCompletedEmail = async (userEmail, orderDetails) => {
  const mailOptions = {
    from: '"Singapore Real Estate Tokenization" <no-reply@tokenization.sg>',
    to: userEmail,
    subject: `Order Complete & Tokens Transferred - #${orderDetails.id}`,
    html: `
      <h2>Tokens Transferred</h2>
      <p>Your real estate tokens for Order #${orderDetails.id} have been minted and transferred to your wallet!</p>
    `
  };
  return transporter.sendMail(mailOptions).catch(err => console.log('Mail Log:', err.message));
};
