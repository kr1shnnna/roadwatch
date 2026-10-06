const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  createReport,
} = require("../controllers/report.controller");

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("citizen"),
  createReport
);

module.exports = router;
