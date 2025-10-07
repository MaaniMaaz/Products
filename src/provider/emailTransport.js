
// import nodemailer from "nodemailer";

const nodemailer = require("nodemailer")
const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/config.env" });

const transporter = nodemailer.createTransport({
    // service: 'gmail',
//   host: "mail.privateemail.com",
// //   host: "1.2.3.4",
//   port: 465,
//   secure: true, // use false for STARTTLS; true for SSL on port 465
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.APP_PASSWORD,
//   },


  host: "mail.privateemail.com",      // e.g. "mail.strato.de" or "smtp.yourdomain.com"
    port: 465,      // usually 465 (SSL) or 587 (TLS)
    secure: true, // true for port 465
    auth: {
      user: process.env.EMAIL,
      pass:process.env.APP_PASSWORD,
    },
  
});

// });

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with mail transporter config:", error);
  } else {
    console.log("Mail transporter is ready to send emails");
  }
});


module.exports = transporter;