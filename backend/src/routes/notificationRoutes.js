const express = require("express");

const router = express.Router();

const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getNotifications);

router.patch(
    "/read-all",
    protect,
    markAllNotificationsAsRead
);

router.patch(
    "/:id/read",
    protect,
    markNotificationAsRead
);

router.delete(
    "/:id",
    protect,
    deleteNotification
);

module.exports = router;
