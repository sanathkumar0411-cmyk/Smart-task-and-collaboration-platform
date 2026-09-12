const express = require("express");

const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(createTask);

router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch("/:id/status", updateTaskStatus);

router.patch("/:id/assign", assignTask);

module.exports = router;
