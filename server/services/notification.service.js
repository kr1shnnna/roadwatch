const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  eventKey,
  report = null,
  assignment = null,
}) => {
  try {
    if (!recipient) {
      throw new Error("Notification recipient is required.");
    }

    if (!type) {
      throw new Error("Notification type is required.");
    }

    if (!eventKey) {
      throw new Error("Notification eventKey is required.");
    }

    const notification = await Notification.findOneAndUpdate(
      {
        eventKey,
      },
      {
        $setOnInsert: {
          recipient,
          type,
          title,
          message,
          report,
          assignment,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return notification;
  } catch (error) {
    console.error(
      "Create notification error:",
      error.message
    );

    // Notification failure should not break
    // the main RoadWatch workflow.
    return null;
  }
};

module.exports = {
  createNotification,
};
