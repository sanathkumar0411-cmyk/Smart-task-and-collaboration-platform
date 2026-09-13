const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
        user: req.user._id,
    })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        count: notifications.length,
        notifications,
    });
});

// PATCH /api/notifications/:id/read
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification marked as read",
        notification,
    });
});

// PATCH /api/notifications/read-all
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            user: req.user._id,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
            },
        }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
    });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
    });
});

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
};
