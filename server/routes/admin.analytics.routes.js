const express = require("express");

const {
  getAnalyticsOverview,
    getOfficerAnalytics,
    getDepartmentAnalytics,
    getReportTrends,
} = require("../controllers/admin.analytics.controller");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

router.get(
  "/overview",
  protect,
  requireRole("authority_admin", "super_admin"),
  getAnalyticsOverview
);


router.get(
  "/officers",
  protect,
  requireRole("authority_admin", "super_admin"),
  getOfficerAnalytics
);


router.get(
  "/departments",
  protect,
  requireRole("authority_admin", "super_admin"),
  getDepartmentAnalytics
);

router.get(
  "/trends",
  protect,
  requireRole("authority_admin", "super_admin"),
  getReportTrends
);



module.exports = router;
