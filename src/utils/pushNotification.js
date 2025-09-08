const admin = require("firebase-admin");
const serviceAccount = require("./fcm.json");
const Notification = require("../models/User/notification");
const { google } = require("googleapis");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const sendNotification = async (user, title, body, type, data) => {
  try {
    const notification = await Notification.create({
      user: user._id,
      message: body,
      type,
      data: data,
    });
    await notification.save();

    if (user.deviceToken && user.isNotificationEnabled) {
      const auth = new google.auth.GoogleAuth({
        keyFile: "./src/utils/fcm.json",
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      const accessToken = await auth.getAccessToken();

      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          data: JSON.stringify(data),
        },
        token: user.deviceToken,
      };
      const response = await fetch(
        "https://fcm.googleapis.com/v1/projects/urbanfootball-704b9/messages:send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message }),
        }
      );
      const jsonResponse = await response.json();
      console.log(jsonResponse);
    }
  } catch (error) {
    console.log("errr", error);
    console.error("Error sending message:", error.message);
    throw error;
  }
};
module.exports = sendNotification;
