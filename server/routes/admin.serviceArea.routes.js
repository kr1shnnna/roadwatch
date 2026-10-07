const express = require("express");

const {
  getServiceAreas,
  getServiceAreaById,
    createServiceArea,
    updateServiceArea,
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


router.get(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  getServiceAreaById
);


router.post(
  "/",
  protect,
  requireRole("authority_admin", "super_admin"),
  createServiceArea
);


router.patch(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  updateServiceArea
);
module.exports = router;
