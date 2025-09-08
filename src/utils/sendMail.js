const dotenv = require("dotenv");
const sendGrid = require("@sendgrid/mail");
dotenv.config({ path: "./src/config/config.env" });
sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (email, subject, text) => {
  try {
    const msg = {
      from: "developer@dotclickllc.com",
      to: email,
      subject: subject,
      html: text,
    };

    await sendGrid.send(msg);
  } catch (error) {
    console.log("Error in sendMail", error.response.body.errors);
  }
};

module.exports = sendMail;
