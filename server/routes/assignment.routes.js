const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getMyAssignments,
} = require("../controllers/assignment.controller");

const router = express.Router();

router.get(
  "/my",
  protect,
  requireRole("officer"),
  getMyAssignments
);

module.exports = router;
