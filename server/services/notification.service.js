const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  report = null,
  assignment = null,
  eventKey,
}) => {
  try {
    if (!recipient || !type || !title || !message || !eventKey) {
      console.error(
        "Create notification skipped: required fields are missing."
      );

      return null;
    }

    const result = await Notification.findOneAndUpdate(
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
          eventKey,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        includeResultMetadata: true,
      }
    );

    const notification = result.value;

    if (!notification) {
      console.error(
        "Notification creation failed: no notification returned."
      );

      return null;
    }

    // Only emit through Socket.IO when the notification
    // was newly inserted. Existing eventKey = no duplicate emit.
    const wasCreated =
      result.lastErrorObject?.updatedExisting === false;

    if (wasCreated) {
      try {
        const io = getIO();

        io.to(`user:${recipient.toString()}`).emit(
          "notification:new",
          {
            notification,
          }
        );
      } catch (socketError) {
        // Socket delivery failure should not break
        // database notification creation.
        console.error(
          "Socket notification emit error:",
          socketError.message
        );
      }
    }

    return notification;
  } catch (error) {
    console.error(
      "Create notification error:",
      error.message
    );

    return null;
  }
};

module.exports = {
  createNotification,
};
