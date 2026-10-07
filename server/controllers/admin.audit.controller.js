const mongoose = require("mongoose");

const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      actor,
      entityType,
      entityId,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // ----------------------------------------
    // Action filter
    // ----------------------------------------

    if (action !== undefined) {
      if (typeof action !== "string" || !action.trim()) {
        return res.status(400).json({
          success: false,
          message: "Action must be a non-empty string.",
        });
      }

      filter.action = action.trim();
    }

    // ----------------------------------------
    // Actor filter
    // ----------------------------------------

    if (actor !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(actor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid actor ID.",
        });
      }

      filter.actor = actor;
    }

    // ----------------------------------------
    // Entity type filter
    // ----------------------------------------

    if (entityType !== undefined) {
      const allowedEntityTypes = [
        "Report",
        "Assignment",
        "User",
        "Department",
        "ServiceArea",
      ];

      if (!allowedEntityTypes.includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid entity type.",
        });
      }

      filter.entityType = entityType;
    }

    // ----------------------------------------
    // Entity ID filter
    // ----------------------------------------

    if (entityId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(entityId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid entity ID.",
        });
      }

      filter.entityId = entityId;
    }

    // ----------------------------------------
    // Pagination validation
    // ----------------------------------------

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer.",
      });
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100.",
      });
    }

    const skip =
      (parsedPage - 1) * parsedLimit;

    // ----------------------------------------
    // Query
    // ----------------------------------------

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages =
      Math.ceil(total / parsedLimit);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
        hasNextPage:
          parsedPage < totalPages,
        hasPreviousPage:
          parsedPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs.",
    });
  }
};

module.exports = {
  getAuditLogs,
};