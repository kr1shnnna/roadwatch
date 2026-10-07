const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getAdminReports,
  getUnassignedReports,
  getAdminReportById,
  assignReport,
  reassignReport,
} = require("../controllers/admin.report.controller");

const router = express.Router();

const adminRoles = requireRole(
  "authority_admin",
  "super_admin"
);

router.get(
  "/",
  protect,
  adminRoles,
  getAdminReports
);

router.get(
  "/unassigned",
  protect,
  adminRoles,
  getUnassignedReports
);

router.get(
  "/:id",
  protect,
  adminRoles,
  getAdminReportById
);

router.patch(
  "/:id/assign",
  protect,
  adminRoles,
  assignReport
);

router.patch(
  "/:id/reassign",
  protect,
  adminRoles,
  reassignReport
);

module.exports = router;
