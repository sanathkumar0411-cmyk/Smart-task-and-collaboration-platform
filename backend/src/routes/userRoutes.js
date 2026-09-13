const express = require("express");

const router = express.Router();

const {
    getUsers,
    getUserById,
    getMyProfile,
    updateMyProfile,
    updateUserRole,
    deleteUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// Current user's profile
router.get("/me", protect, getMyProfile);

router.put("/me", protect, updateMyProfile);


// Admin-only user management
router.get(
    "/",
    protect,
    authorizeRoles("Admin"),
    getUsers
);

router.get(
    "/:id",
    protect,
    authorizeRoles("Admin"),
    getUserById
);

router.patch(
    "/:id/role",
    protect,
    authorizeRoles("Admin"),
    updateUserRole
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("Admin"),
    deleteUser
);

module.exports = router;
