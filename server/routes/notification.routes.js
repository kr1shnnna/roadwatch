const express = require("express");

const protect = require("../middleware/auth");

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification.controller");

const router = express.Router();

// Get all notifications for logged-in user
router.get(
  "/",
  protect,
  getMyNotifications
);

// Get unread notification count
router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

// Mark all notifications as read
router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);

// Mark one notification as read
router.patch(
  "/:id/read",
  protect,
  markNotificationAsRead
);

module.exports = router;
