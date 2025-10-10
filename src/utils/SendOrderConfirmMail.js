const transporter = require("../provider/emailTransport.js");
const dotenv = require("dotenv");

dotenv.config({ path: "./src/config/config.env" });

const sendOrderMail = async (recipientEmail, orderId, status) => {
  try {
    // Different subject + message based on status
    let subject, message, color;
    switch (status) {
     case "pending":
  subject = "Your Order is Pending ⏳";
  message = "Thank you for choosing us! Your order has been reviewed and is now in a pending state. You can proceed with the payment to get it marked as paid.";
  color = "#EAB308";
  break;
      case "confirmed":
        subject = "Your Order is Confirmed ✅";
        message = "Thank you for shopping with us! Your order has been successfully confirmed.";
        color = "#036958";
        break;

      case "shipped":
        subject = "Your Order is on the Way 🚚";
        message = "Good news! Your order has been shipped and is on its way to you.";
        color = "#007bff";
        break;

      case "cancelled":
        subject = "Your Order has been Cancelled ❌";
        message = "We’re sorry to inform you that your order has been cancelled. Please contact support if this is unexpected.";
        color = "#dc3545";
        break;

      default:
        subject = "Order Update";
        message = "Your order status has been updated.";
        color = "#333";
    }

    const orderLink = status === "pending"
  ? `
    <div style="text-align:center; margin: 20px 0;">
      <a href="https://portal.primewelldistribution.com/dashboard/order"
         style="background-color:${color}; color:#ffffff; padding:12px 24px; 
                text-decoration:none; border-radius:6px; display:inline-block; 
                font-weight:bold;">
        View Orders
      </a>
    </div>
  `
  : "";
    const mailOptions = {
  from: `"Primewell" <${process.env.EMAIL}>`,
     to: recipientEmail,
      subject,
      text: `Hi, your order #${orderId} is now ${status}.`,
      html: `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order ${status}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: ${color};
      margin-bottom: 10px;
    }
    .order-box {
      background: #f9f9f9;
      border: 2px dashed ${color};
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .order-id {
      font-size: 24px;
      font-weight: bold;
      color: ${color};
      margin: 10px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏥 Primewell</div>
      <h2>Order ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
    </div>

    <p>Hello,</p>
    <p>${message}</p>

   ${orderLink}

    <div class="order-box">
      <div>Your Order ID is:</div>
      <div class="order-id">#${orderId}</div>
    </div>

    <p>If you have any questions, please contact our support team.</p>

    <div class="footer">
      <p>This is an automated message from Primewell.</p>
      <p>&copy; 2025 Primewell. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order ${status} email sent: `, info.messageId);
  } catch (error) {
    console.error("Error sending order email: ", error);
  }
};

module.exports = sendOrderMail;
