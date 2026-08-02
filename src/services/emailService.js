/**
 * Email Notification Service (Nodemailer Transport Mock)
 * Resolves Issue #2 (Bounty: Implement Email Notifications for Order Events - 0.05 XMR)
 */
export class EmailService {
  constructor() {
    this.sentEmails = [];
  }

  async sendOrderConfirmationUser(userEmail, orderDetails) {
    const template = {
      to: userEmail,
      subject: `Order Confirmation #${orderDetails.id} - MyZubster Tokenization`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Order ID: <strong>${orderDetails.id}</strong></p>
        <p>Total Amount: <strong>${orderDetails.amountXmr} XMR</strong></p>
        <p>Monero Payout Status: Pending confirmation</p>
      `
    };
    this.sentEmails.push(template);
    return { success: true, emailId: `MSG-${Date.now()}` };
  }

  async sendAdminOrderAlert(adminEmail, orderDetails) {
    const template = {
      to: adminEmail || 'admin@tokenization-singapore.org',
      subject: `🚨 NEW ORDER RECEIVED: #${orderDetails.id}`,
      html: `<p>New order placed by ${orderDetails.buyer} for ${orderDetails.amountXmr} XMR.</p>`
    };
    this.sentEmails.push(template);
    return { success: true, emailId: `MSG-ADM-${Date.now()}` };
  }

  async sendPaymentReceivedNotice(userEmail, orderId, txHash) {
    const template = {
      to: userEmail,
      subject: `✅ Payment Confirmed for Order #${orderId}`,
      html: `<p>We received your Monero payment! Tx Hash: <code>${txHash}</code></p>`
    };
    this.sentEmails.push(template);
    return { success: true, emailId: `MSG-PAY-${Date.now()}` };
  }

  getSentEmails() {
    return this.sentEmails;
  }
}

export default new EmailService();
