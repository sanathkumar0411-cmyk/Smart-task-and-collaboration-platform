const mongoose = require("mongoose");
const Project = require("../models/project");
const User = require("../models/user");

// ==========================================
// CREATE PROJECT
// ==========================================
const createProject = async (req, res) => {
  try {
    // Only ADMIN and PROJECT_MANAGER can create projects
    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "PROJECT_MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admin or project manager can create projects"
      });
    }

    const {
      name,
      description,
      members,
      priority,
      status,
      startDate,
      deadline
    } = req.body;

    // Check required field
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    // Logged-in user becomes the manager
    const manager = req.user.userId;

    // Make sure manager ID is valid
    if (!mongoose.Types.ObjectId.isValid(manager)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager ID"
      });
    }

    // Check if manager actually exists
    const managerUser = await User.findById(manager);

    if (!managerUser) {
      return res.status(404).json({
        success: false,
        message: "Manager user not found"
      });
    }

    // Check members
    let projectMembers = [];

    if (members && members.length > 0) {
      // Make sure members is an array
      if (!Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          message: "Members must be an array"
        });
      }

      // Check that all member IDs are valid
      for (const memberId of members) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid user ID: ${memberId}`
          });
        }
      }

      // Remove duplicate IDs
      projectMembers = [...new Set(members.map(id => id.toString()))];

      // Check that users actually exist
      const users = await User.find({
        _id: { $in: projectMembers }
      });

      if (users.length !== projectMembers.length) {
        return res.status(400).json({
          success: false,
          message: "One or more members do not exist"
        });
      }
    }

    // Add manager automatically to members
    if (!projectMembers.includes(manager.toString())) {
      projectMembers.push(manager.toString());
    }

    // Create project
    const project = await Project.create({
      name: name.trim(),
      description,
      manager,
      members: projectMembers,
      priority: priority || "MEDIUM",
      status: status || "PLANNING",
      startDate,
      deadline
    });

    // Return populated project
    const populatedProject = await Project.findById(project._id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject
    });

  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// GET ALL PROJECTS
// ==========================================
const getProjects = async (req, res) => {
  try {
    let projects;

    // Admin can see all projects
    if (req.user.role === "ADMIN") {
      projects = await Project.find()
        .populate("manager", "name email role")
        .populate("members", "name email role")
        .sort({ createdAt: -1 });
    } else {
      // Other users only see projects where they are
      // manager or member
      projects = await Project.find({
        $or: [
          { manager: req.user.userId },
          { members: req.user.userId }
        ]
      })
        .populate("manager", "name email role")
        .populate("members", "name email role")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });

  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// GET SINGLE PROJECT
// ==========================================
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Admin can view every project
    if (req.user.role !== "ADMIN") {
      const isManager =
        project.manager._id.toString() === req.user.userId.toString();

      const isMember = project.members.some(
        member => member._id.toString() === req.user.userId.toString()
      );

      if (!isManager && !isMember) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this project"
        });
      }
    }

    return res.status(200).json({
      success: true,
      project
    });

  } catch (error) {
    console.error("GET PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// UPDATE PROJECT
// ==========================================
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Admin can update any project
    // Project manager can update their own project
    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      project.manager.toString() === req.user.userId.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: "Only the project manager or admin can update this project"
      });
    }

    const {
      name,
      description,
      priority,
      status,
      startDate,
      deadline
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty"
        });
      }

      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description;
    }

    if (priority !== undefined) {
      project.priority = priority;
    }

    if (status !== undefined) {
      project.status = status;
    }

    if (startDate !== undefined) {
      project.startDate = startDate;
    }

    if (deadline !== undefined) {
      project.deadline = deadline;
    }

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject
    });

  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// DELETE PROJECT
// ==========================================
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Admin can delete any project
    // Project manager can delete their own project
    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      project.manager.toString() === req.user.userId.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: "Only the project manager or admin can delete this project"
      });
    }

    await Project.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// ADD MEMBER
// ==========================================
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Admin or project manager can add members
    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      project.manager.toString() === req.user.userId.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: "Only the project manager or admin can add members"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already a member
    if (
      project.members.some(
        member => member.toString() === userId.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "User is already a project member"
      });
    }

    project.members.push(userId);

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      project: updatedProject
    });

  } catch (error) {
    console.error("ADD MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// REMOVE MEMBER
// ==========================================
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Admin or project manager can remove members
    const isAdmin = req.user.role === "ADMIN";

    const isManager =
      project.manager.toString() === req.user.userId.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: "Only the project manager or admin can remove members"
      });
    }

    // Do not allow removing the project manager
    if (project.manager.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project manager cannot be removed from the project"
      });
    }

    // Check whether user is actually a member
    const isMember = project.members.some(
      member => member.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "User is not a project member"
      });
    }

    project.members = project.members.filter(
      member => member.toString() !== userId.toString()
    );

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      project: updatedProject
    });

  } catch (error) {
    console.error("REMOVE MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
};
