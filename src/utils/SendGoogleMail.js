// import dotenv from "dotenv";
const  transporter = require( "../provider/emailTransport.js");
const dotenv = require("dotenv");

dotenv.config({ path: "./src/config/config.env" });

const sendGoogleOtpMail = async (recipientEmail, otp , type) => {
  try {
    const mailOptions = {
      from: `"Deniel Assistance" <${process.env.EMAIL}>`,
      to: recipientEmail,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
      html: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Code</title>
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
        .code-container {
            background: #e5faf4;
            border: 2px dashed #036958;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #036958;
            letter-spacing: 8px;
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
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏥 Deniel Assistance</div>
            <h2>Your ${type} Verification Code</h2>
        </div>
        
        <p>Hello,</p>
        <p>You requested to ${type} to your Deniel Assistance account. Please use the verification code below:</p>
        
        <div class="code-container">
            <div>Your verification code is:</div>
            <div class="code">${otp}</div>
            <div style="font-size: 14px; color: #666; margin-top: 10px;">
                This code will expire in 5 minutes
            </div>
        </div>
        
        <div class="warning">
            <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share this code with anyone.
        </div>
        
        <p>If you're having trouble ${type}, please contact our support team.</p>
        
        <div class="footer">
            <p>This is an automated message from Deniel Assistance.</p>
            <p>&copy; 2025 Deniel Assistance. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent: ", info.messageId);
  } catch (error) {
    console.error("Error sending OTP: ", error);
  }
};

module.exports = sendGoogleOtpMail;