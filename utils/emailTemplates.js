const orderConfirmed = (order) => ({
  subject: `Order #${order._id} Confirmed`,
  html: `
    <h2>Order Confirmed</h2>
    <p>Your order <strong>#${order._id}</strong> has been confirmed.</p>
    <p>Token: ${order.tokenSymbol || 'N/A'}</p>
    <p>Amount: ${order.amount} ${order.currency}</p>
    <p>Status: ${order.status}</p>
    <hr/>
    <p>View your order: <a href="${process.env.BASE_URL}/orders/${order._id}">Dashboard</a></p>
  `,
  text: `Order #${order._id} confirmed. Token: ${order.tokenSymbol}. Amount: ${order.amount} ${order.currency}.`,
});

const orderCompleted = (order) => ({
  subject: `Order #${order._id} Completed`,
  html: `
    <h2>Order Completed</h2>
    <p>Your order <strong>#${order._id}</strong> has been completed.</p>
    <p>Tokens have been minted and transferred to your wallet.</p>
    <hr/>
    <p><a href="${process.env.BASE_URL}/orders/${order._id}">View Details</a></p>
  `,
  text: `Order #${order._id} completed. Tokens minted.`,
});

const orderCancelled = (order) => ({
  subject: `Order #${order._id} Cancelled`,
  html: `
    <h2>Order Cancelled</h2>
    <p>Your order <strong>#${order._id}</strong> has been cancelled.</p>
    ${order.cancelReason ? `<p>Reason: ${order.cancelReason}</p>` : ''}
    <hr/>
    <p><a href="${process.env.BASE_URL}/orders">View Orders</a></p>
  `,
  text: `Order #${order._id} cancelled.`,
});

const paymentReminder = (order) => ({
  subject: `Payment Reminder: Order #${order._id}`,
  html: `
    <h2>Payment Reminder</h2>
    <p>Your order <strong>#${order._id}</strong> requires payment.</p>
    <p>Amount: ${order.amount} ${order.currency}</p>
    <p>Time remaining: ${order.timeRemaining || '12 hours'}</p>
    <hr/>
    <p><a href="${process.env.BASE_URL}/orders/${order._id}/pay">Complete Payment</a></p>
  `,
  text: `Payment reminder for order #${order._id}. Amount: ${order.amount} ${order.currency}.`,
});

const adminNewOrder = (order) => ({
  subject: `New Order #${order._id}`,
  html: `
    <h2>New Order Received</h2>
    <p>Order <strong>#${order._id}</strong> from ${order.userEmail || 'a user'}.</p>
    <p>Token: ${order.tokenSymbol || 'N/A'}</p>
    <p>Amount: ${order.amount} ${order.currency}</p>
    <hr/>
    <p><a href="${process.env.BASE_URL}/admin/orders/${order._id}">Review Order</a></p>
  `,
  text: `New order #${order._id}. Token: ${order.tokenSymbol}. Amount: ${order.amount} ${order.currency}.`,
});

module.exports = {
  orderConfirmed,
  orderCompleted,
  orderCancelled,
  paymentReminder,
  adminNewOrder,
};
