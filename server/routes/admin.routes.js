const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getDashboard,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  requireRole(
    "authority_admin",
    "super_admin"
  ),
  getDashboard
);

module.exports = router;