const { adminNotificationSocket } = require("../functions/socketFunctions");
const Notification = require("../models/User/notification");

const adminNotification = async (user, title, body, type, data) => {
  try {
    const notification = await Notification.create({
      user: user._id,
      message: body,
      type,
      data: data,
    });
    await notification.save();

    await adminNotificationSocket(user._id, {
      title: title,
      body: body,
      type: type,
      data: data,
    });
  } catch (error) {
    console.error("Error sending message:", error.message);
  }
};

module.exports = adminNotification;
