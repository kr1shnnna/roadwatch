const express = require("express");

const {
  getServiceAreas,
} = require("../controllers/admin.serviceArea.controller");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  getServiceAreas
);

module.exports = router;
