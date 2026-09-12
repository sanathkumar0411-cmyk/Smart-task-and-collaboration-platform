const express = require("express");

const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require("../controllers/projectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createProject);

router.get("/", protect, getProjects);

router.get("/:id", protect, getProject);

router.put("/:id", protect, updateProject);

router.delete("/:id", protect, deleteProject);

router.post("/:id/members", protect, addMember);

router.delete("/:id/members/:userId", protect, removeMember);

module.exports = router;
