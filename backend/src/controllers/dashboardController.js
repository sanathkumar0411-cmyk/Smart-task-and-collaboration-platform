const Project = require("../models/project");
const Task = require("../models/task");
const asyncHandler = require("../utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        myTasks,
        recentProjects,
        recentTasks,
        upcomingTasks,
        overdueTasks,
    ] = await Promise.all([
        // Total projects where user is manager/member
        Project.countDocuments({
            $or: [
                { manager: userId },
                { members: userId },
            ],
        }),

        // Total tasks accessible to user
        Task.countDocuments(),

        // Completed
        Task.countDocuments({
            status: "COMPLETED",
        }),

        // In progress
        Task.countDocuments({
            status: "IN_PROGRESS",
        }),

        // TODO
        Task.countDocuments({
            status: "TODO",
        }),

        // Review
        Task.countDocuments({
            status: "REVIEW",
        }),

        // Tasks assigned to current user
        Task.find({
            assignedTo: userId,
        })
            .populate("project", "name")
            .sort({ dueDate: 1 })
            .limit(10),

        // Recent projects
        Project.find({
            $or: [
                { manager: userId },
                { members: userId },
            ],
        })
            .populate("manager", "name email")
            .sort({ createdAt: -1 })
            .limit(5),

        // Recent tasks
        Task.find({})
            .populate("project", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 })
            .limit(5),

        // Upcoming deadlines
        Task.find({
            assignedTo: userId,
            dueDate: {
                $gte: new Date(),
            },
            status: {
                $ne: "COMPLETED",
            },
        })
            .populate("project", "name")
            .sort({ dueDate: 1 })
            .limit(10),

        // Overdue
        Task.find({
            assignedTo: userId,
            dueDate: {
                $lt: new Date(),
            },
            status: {
                $ne: "COMPLETED",
            },
        })
            .populate("project", "name")
            .sort({ dueDate: 1 })
            .limit(10),
    ]);

    // Calculate overall progress
    const progress =
        totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

    res.status(200).json({
        success: true,

        statistics: {
            totalProjects,
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            reviewTasks,
            progress,
        },

        myTasks,

        recentProjects,

        recentTasks,

        upcomingTasks,

        overdueTasks,
    });
});

module.exports = {
    getDashboard,
};
