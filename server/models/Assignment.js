const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },

    serviceArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceArea",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "assigned",
        "accepted",
        "in_progress",
        "rejected",
        "completed",
      ],
      default: "assigned",
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model(
  "Assignment",
  assignmentSchema
);

module.exports = Assignment;