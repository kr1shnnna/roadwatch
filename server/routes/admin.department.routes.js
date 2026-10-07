const express = require("express");

const {
  getDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
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


router.get(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  getDepartmentById
);


router.patch(
  "/:id",
  protect,
  requireRole("authority_admin", "super_admin"),
  updateDepartment
);


router.patch(
  "/:id/status",
  protect,
  requireRole("authority_admin", "super_admin"),
  updateDepartmentStatus
);



module.exports = router;