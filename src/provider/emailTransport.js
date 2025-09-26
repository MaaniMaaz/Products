
// import nodemailer from "nodemailer";

const nodemailer = require("nodemailer")
const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/config.env" });

const transporter = nodemailer.createTransport({
    // service: 'gmail',
  host: "mail.privateemail.com",
//   host: "1.2.3.4",
  port: 465,
  secure: true, // use false for STARTTLS; true for SSL on port 465
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});
// const transporter = nodemailer.createTransport({
//   service: 'google', // or your email service
//   host: 'mail.privateemail.com', // correct SMTP server
//   port: 587, // or 465 for SSL
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD // App password for Gmail
//   }
// });

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with mail transporter config:", error);
  } else {
    console.log("Mail transporter is ready to send emails");
  }
});


module.exports = transporter;