const express = require("express");
const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");
const upload = require("../middleware/upload");

const {
  createReport,
  getMyReports,
  getReportById,
  getReports,
  getNearbyReports,
  confirmReport,
  reopenReport,
} = require("../controllers/report.controller");

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("citizen"),
  upload.array("images", 5),
  createReport,
);

router.get("/my", protect, requireRole("citizen"), getMyReports);

router.get("/nearby", getNearbyReports);

router.get("/", getReports);

router.patch("/:id/confirm", protect, requireRole("citizen"), confirmReport);

router.patch(
  "/:id/reopen",
  protect,
  requireRole("citizen"),
  upload.array("images", 5),
  reopenReport,
);

router.get("/:id", protect, requireRole("citizen"), getReportById);

module.exports = router;
