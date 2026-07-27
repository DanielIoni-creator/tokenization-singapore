// backend/services/emailService.js
// Email notification service for order events.
// Mirrors the structure of telegram/services/notification.js.
// Sends transactional emails to users (order created / confirmed / completed)
// and to the admin (new order / completed) so nobody has to poll the dashboard.

const nodemailer = require('nodemailer');
const config = require('../config'); // expects: smtp host/user/pass/from + adminEmail

// Lazily create a transporter; returns null when SMTP is not configured
// so the rest of the app keeps working in dev without email set up.
let _transporter = null;
function transporter() {
  if (_transporter) return _transporter;
  if (!config.smtp || !config.smtp.host) return null;
  _transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port || 587,
    secure: config.smtp.secure || false,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  });
  return _transporter;
}

function money(n) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

async function send(to, subject, html) {
  const t = transporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({
      from: config.smtp.from || config.adminEmail,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[emailService] send failed:', err.message);
    return false;
  }
}

async function notifyNewOrder(order, userEmail) {
  const subject = `🆕 New Order #${order._id.toString().slice(-6)}`;
  const html = `
    <h2>New Order Placed</h2>
    <p><strong>Order:</strong> #${order._id.toString().slice(-6)}</p>
    <p><strong>Amount:</strong> ${money(order.totalPrice)}</p>
    <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><a href="${config.apiUrl || ''}/orders/${order._id}">View order</a></p>`;
  await send(userEmail, subject, html);
  if (config.adminEmail) await send(config.adminEmail, `[Admin] ${subject}`, html);
}

async function notifyPaymentConfirmed(order, userEmail) {
  const subject = `✅ Payment Confirmed — Order #${order._id.toString().slice(-6)}`;
  const html = `
    <h2>Payment Confirmed</h2>
    <p><strong>Order:</strong> #${order._id.toString().slice(-6)}</p>
    <p><strong>Amount:</strong> ${money(order.totalPrice)}</p>
    <p><strong>Tx:</strong> ${order.moneroTxHash || 'N/A'}</p>
    <p>Status updated to <strong>${order.status}</strong>.</p>`;
  await send(userEmail, subject, html);
}

async function notifyOrderCompleted(order, userEmail) {
  const subject = `🎉 Order Completed — #${order._id.toString().slice(-6)}`;
  const html = `
    <h2>Order Completed</h2>
    <p><strong>Order:</strong> #${order._id.toString().slice(-6)}</p>
    <p><strong>Amount:</strong> ${money(order.totalPrice)}</p>
    <p>Your tokens have been minted. 🪙</p>`;
  await send(userEmail, subject, html);
  if (config.adminEmail) await send(config.adminEmail, `[Admin] ${subject}`, html);
}

module.exports = {
  send,
  notifyNewOrder,
  notifyPaymentConfirmed,
  notifyOrderCompleted,
};
