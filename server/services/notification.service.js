
const Notification = require("../models/Notification");

const {
  getIO,
  getUnreadNotificationCount,
} = require("../config/socket");

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
    if (
      !recipient ||
      !type ||
      !title ||
      !message ||
      !eventKey
    ) {
      console.error(
        "Create notification skipped: required fields are missing."
      );

      return null;
    }

    const result =
      await Notification.findOneAndUpdate(
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

    // Only emit Socket.IO events when a new
    // notification was actually created.
    const wasCreated =
      result.lastErrorObject?.updatedExisting === false;

    if (wasCreated) {
      try {
        const io = getIO();

        const unreadCount =
          await getUnreadNotificationCount(
            recipient
          );

        const userRoom =
          `user:${recipient.toString()}`;

        // Send the new notification
        io.to(userRoom).emit(
          "notification:new",
          {
            notification,
            unreadCount,
          }
        );

        // Keep unread notification count synchronized
        io.to(userRoom).emit(
          "notifications:unread_count",
          {
            unreadCount,
          }
        );
      } catch (socketError) {
        // Socket delivery failure should never
        // break database notification creation.
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
