import nodemailer from 'nodemailer';

// Email Notifications for Order Events
// Solves Issue #2 (0.05 XMR Bounty)
export async function sendOrderNotificationEmail(
  userEmail: string,
  orderId: string,
  status: 'CREATED' | 'SETTLED' | 'CANCELLED',
  amountUSD: number
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });

  const mailOptions = {
    from: '"Singapore Tokenization Platform" <noreply@tokenization.sg>',
    to: userEmail,
    subject: `Order Update #${orderId}: ${status}`,
    html: `
      <h2>Order Status Update</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Status: <strong>${status}</strong></p>
      <p>Total Value: <strong>$${amountUSD.toFixed(2)} USD</strong></p>
    `
  };

  await transporter.sendMail(mailOptions);
}
