const Comment = require("../models/Comment");
const Task = require("../models/task");
const Project = require("../models/project");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");
const createNotification = require("../utils/createNotification");

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;
  const { text } = req.body;

  if (!validateObjectId(taskId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Comment text is required",
    });
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const project = await Project.findById(task.project);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  const isAdmin = req.user.role === "admin";

  const isManager =
    project.manager.toString() === req.user._id.toString();

  const isMember = project.members.some(
    (member) => member.toString() === req.user._id.toString()
  );

  const isAssigned =
    task.assignedTo &&
    task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isManager && !isMember && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this task",
    });
  }

  const comment = await Comment.create({
    task: taskId,
    user: req.user._id,
    text: text.trim(),
  });

  const populatedComment = await Comment.findById(comment._id)
    .populate("user", "name email role");

  // Notify assigned user when somebody else comments
  if (
    task.assignedTo &&
    task.assignedTo.toString() !== req.user._id.toString()
  ) {
    await createNotification({
      user: task.assignedTo,
      message: `${req.user.name} commented on your task: ${task.title}`,
      type: "COMMENT_ADDED",
    });
  }

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comment: populatedComment,
  });
});

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;

  if (!validateObjectId(taskId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const project = await Project.findById(task.project);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  const isAdmin = req.user.role === "admin";

  const isManager =
    project.manager.toString() === req.user._id.toString();

  const isMember = project.members.some(
    (member) => member.toString() === req.user._id.toString()
  );

  const isAssigned =
    task.assignedTo &&
    task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isManager && !isMember && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this task",
    });
  }

  const comments = await Comment.find({
    task: taskId,
  })
    .populate("user", "name email role")
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: comments.length,
    comments,
  });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid comment ID",
    });
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: "Comment not found",
    });
  }

  const isAdmin = req.user.role === "admin";

  const isCommentOwner =
    comment.user.toString() === req.user._id.toString();

  if (!isAdmin && !isCommentOwner) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own comments",
    });
  }

  await Comment.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
  });
});

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
