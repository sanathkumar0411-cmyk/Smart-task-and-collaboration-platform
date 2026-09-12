const mongoose = require("mongoose");
const Task = require("../models/task");
const Project = require("../models/project");
const Notification = require("../models/Notification");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      assignedTo,
      priority,
      status,
      dueDate,
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({
        success: false,
        message: "Title and project are required",
      });
    }

    const projectDoc = await Project.findById(project);

    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const hasAccess =
      req.user.role === "ADMIN" ||
      projectDoc.manager.toString() === req.user._id.toString() ||
      projectDoc.members.some(
        (member) => member.toString() === req.user._id.toString()
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority,
      status,
      dueDate,
    });

    if (assignedTo) {
      await Notification.create({
        user: assignedTo,
        message: `You have been assigned a new task: ${title}`,
        type: "TASK_ASSIGNED",
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, project, search } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (project) filter.project = project;

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name manager members");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isManager =
      req.user.role === "ADMIN" ||
      task.project.manager.toString() === req.user._id.toString();

    const isAssignee =
      task.assignedTo &&
      task.assignedTo.toString() === req.user._id.toString();

    if (!isManager && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this task",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "dueDate",
      "assignedTo",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const allowed =
      req.user.role === "ADMIN" ||
      task.project.manager.toString() === req.user._id.toString() ||
      task.createdBy.toString() === req.user._id.toString();

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this task",
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "REVIEW",
      "COMPLETED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.status = status;

    await task.save();

    res.json({
      success: true,
      message: "Task status updated",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const assignTask = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.assignedTo = userId;

    await task.save();

    await Notification.create({
      user: userId,
      message: `You have been assigned a new task: ${task.title}`,
      type: "TASK_ASSIGNED",
    });

    res.json({
      success: true,
      message: "Task assigned successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
};
