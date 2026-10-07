const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  req = null,
  actor,
  action,
  entityType,
  entityId,
  details = {},
}) => {
  try {
    if (!actor) {
      console.error(
        "Audit log skipped: actor is missing."
      );

      return null;
    }

    if (!action || !entityType || !entityId) {
      console.error(
        "Audit log skipped: required fields are missing."
      );

      return null;
    }

    const auditLog = await AuditLog.create({
      actor: actor._id || actor,

      actorRole: actor.role,

      action,

      entityType,

      entityId,

      details,

      ipAddress: req?.ip || null,

      userAgent:
        req?.get("user-agent") || null,
    });

    return auditLog;
  } catch (error) {
    // Audit logging should not break the main business operation.
    console.error(
      "Create audit log error:",
      error.message
    );

    return null;
  }
};

module.exports = {
  createAuditLog,
};
