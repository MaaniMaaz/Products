// import dotenv from "dotenv";
const transporter = require("../provider/emailTransport.js");
const dotenv = require("dotenv");

dotenv.config({ path: "./src/config/config.env" });

const sendOrderConfirmationMail = async (recipientEmail, orderId) => {
  try {
    const mailOptions = {
      from: `"Primewell" <${process.env.EMAIL}>`,
      to: recipientEmail,
      subject: "Your Order is Confirmed ✅",
      text: `Hi, your order #${orderId} has been confirmed.`,
      html: `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
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
      color: #036958;
      margin-bottom: 10px;
    }
    .order-box {
      background: #e5faf4;
      border: 2px dashed #036958;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .order-id {
      font-size: 24px;
      font-weight: bold;
      color: #036958;
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
      <h2>Order Confirmation</h2>
    </div>

    <p>Hello,</p>
    <p>Thank you for shopping with us! Your order has been successfully confirmed.</p>

    <div class="order-box">
      <div>Your Order ID is:</div>
      <div class="order-id">#${orderId}</div>
    </div>

    <p>We’ll notify you when your order is shipped.</p>
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
    console.log("Order confirmation sent: ", info.messageId);
  } catch (error) {
    console.error("Error sending order confirmation: ", error);
  }
};

module.exports = sendOrderConfirmationMail;
