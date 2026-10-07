const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getOfficers,
  createOfficer,
} = require("../controllers/admin.officer.controller");

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  getOfficers
);

router.post(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  createOfficer
);

module.exports = router;
