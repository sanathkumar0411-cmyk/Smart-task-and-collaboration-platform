const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/users
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        users,
    });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("-password");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// GET /api/users/me
const getMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// PUT /api/users/me
const updateMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (req.body.name !== undefined) {
        user.name = req.body.name;
    }

    if (req.body.avatar !== undefined) {
        user.avatar = req.body.avatar;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
        },
    });
});

// PATCH /api/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    const allowedRoles = [
        "Admin",
        "Project Manager",
        "Team Member",
    ];

    if (!allowedRoles.includes(role)) {
        res.status(400);
        throw new Error("Invalid role");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.role = role;

    await user.save();

    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

// DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Prevent admin from deleting themselves accidentally
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot delete your own account");
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

module.exports = {
    getUsers,
    getUserById,
    getMyProfile,
    updateMyProfile,
    updateUserRole,
    deleteUser,
};
