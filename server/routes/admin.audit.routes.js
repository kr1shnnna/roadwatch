const express = require("express");

const {
  getAuditLogs,
} = require("../controllers/admin.audit.controller");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  getAuditLogs
);

module.exports = router;
