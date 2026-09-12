const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },

    status: {
      type: String,
      enum: ["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"],
      default: "PLANNING"
    },

    startDate: {
      type: Date
    },

    deadline: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Project", projectSchema);
