const Notification = require("../models/Notification");

const createNotification = async ({
  user,
  message,
  type,
}) => {
  try {
    const notification = await Notification.create({
      user,
      message,
      type,
    });

    return notification;
  } catch (error) {
    console.error(
      "Notification creation failed:",
      error.message
    );

    return null;
  }
};

module.exports = createNotification;
