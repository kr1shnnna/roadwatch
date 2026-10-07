const express = require("express");

const {
  getDepartments,
} = require("../controllers/admin.department.controller");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  getDepartments
);

module.exports = router;