const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getMyAssignments,
  acceptAssignment,
  startAssignment,
  resolveAssignment,
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


router.patch(
  "/:id/resolve",
  protect,
  requireRole("officer"),
  resolveAssignment
);



module.exports = router;
