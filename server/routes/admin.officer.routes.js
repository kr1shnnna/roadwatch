const express = require("express");

const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  getOfficers,
  createOfficer,
  getOfficerById,
  updateOfficer,
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

router.get(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  getOfficerById
);


router.patch(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  updateOfficer
);

module.exports = router;
