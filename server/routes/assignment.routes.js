const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getMyAssignments,
  acceptAssignment,
  startAssignment,
} = require("../controllers/assignment.controller");

const router = express.Router();

router.get(
  "/my",
  protect,
  requireRole("officer"),
  getMyAssignments
);


router.patch(
  "/:id/accept",
  protect,
  requireRole("officer"),
  acceptAssignment
);


router.patch(
  "/:id/start",
  protect,
  requireRole("officer"),
  startAssignment
);


module.exports = router;
