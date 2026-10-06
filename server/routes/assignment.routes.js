const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getMyAssignments,
  acceptAssignment,
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

module.exports = router;
