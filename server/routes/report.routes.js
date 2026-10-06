const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  createReport,
    getMyReports,
    getReportById,
    getReports,
} = require("../controllers/report.controller");

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("citizen"),
  createReport
);


router.get(
  "/my",
  protect,
  requireRole("citizen"),
  getMyReports
);

router.get(
  "/",
  getReports
);


router.get(
  "/:id",
  protect,
  requireRole("citizen"),
  getReportById
);




module.exports = router;
