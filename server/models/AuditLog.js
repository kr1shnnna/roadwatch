const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actorRole: {
      type: String,
      enum: [
        "citizen",
        "officer",
        "authority_admin",
        "super_admin",
      ],
      required: true,
    },

    action: {
      type: String,
      enum: [
        // Reports
        "report.created",
        "report.assigned",
        "report.reassigned",
        "report.confirmed",
        "report.reopened",

        // Assignments
        "assignment.accepted",
        "assignment.started",
        "assignment.resolved",
        "assignment.rejected",

        // Officers
        "officer.created",
        "officer.updated",
        "officer.status_changed",

        // Departments
        "department.updated",
        "department.status_changed",

        // Service Areas
        "service_area.created",
        "service_area.updated",
        "service_area.status_changed",
      ],
      required: true,
    },

    entityType: {
      type: String,
      enum: [
        "Report",
        "Assignment",
        "User",
        "Department",
        "ServiceArea",
      ],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Useful for "what did this user do recently?"
auditLogSchema.index({
  actor: 1,
  createdAt: -1,
});

// Useful for entity history
auditLogSchema.index({
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

// Useful for filtering by action
auditLogSchema.index({
  action: 1,
  createdAt: -1,
});

// Useful for admin activity feed
auditLogSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);
