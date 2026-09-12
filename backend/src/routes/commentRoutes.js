const express = require("express");

const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Add comment to task
router.post(
  "/tasks/:id/comments",
  authMiddleware,
  addComment
);

// Get comments for task
router.get(
  "/tasks/:id/comments",
  authMiddleware,
  getComments
);

// Delete comment
router.delete(
  "/comments/:id",
  authMiddleware,
  deleteComment
);

module.exports = router;
