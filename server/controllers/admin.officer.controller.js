const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Department = require("../models/Department");
const ServiceArea = require("../models/ServiceArea");

const { createAuditLog } = require("../services/audit.service");

// GET /api/admin/officers
const getOfficers = async (req, res) => {
  try {
    const { department, serviceArea, isActive } = req.query;

    const filter = {
      role: "officer",
    };

    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }

      filter.department = department;
    }

    if (serviceArea) {
      if (!mongoose.Types.ObjectId.isValid(serviceArea)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service area ID.",
        });
      }

      filter.assignedAreas = serviceArea;
    }

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    const officers = await User.find(filter)
      .select("-password")
      .populate("department", "name categories")
      .populate("assignedAreas", "name city")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: officers.length,
      officers,
    });
  } catch (error) {
    console.error("Get officers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch officers.",
    });
  }
};

// POST /api/admin/officers
const createOfficer = async (req, res) => {
  try {
    const { name, email, password, department, assignedAreas = [] } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and department are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
      });
    }

    if (!Array.isArray(assignedAreas)) {
      return res.status(400).json({
        success: false,
        message: "assignedAreas must be an array.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const departmentExists = await Department.findOne({
      _id: department,
      isActive: true,
    });

    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Active department not found.",
      });
    }

    const validAreaIds = [];

    for (const areaId of assignedAreas) {
      if (!mongoose.Types.ObjectId.isValid(areaId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid service area ID: ${areaId}`,
        });
      }

      validAreaIds.push(areaId);
    }

    if (validAreaIds.length > 0) {
      const areaCount = await ServiceArea.countDocuments({
        _id: { $in: validAreaIds },
        isActive: true,
      });

      if (areaCount !== validAreaIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more service areas are invalid or inactive.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const officer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "officer",
      department,
      assignedAreas: validAreaIds,
      isActive: true,
    });

    await createAuditLog({
      req,
      actor: req.user,
      action: "officer.created",
      entityType: "User",
      entityId: officer._id,
      details: {
        name: officer.name,
        email: officer.email,
        departmentId: officer.department,
        assignedAreaIds: officer.assignedAreas,
      },
    });

    const safeOfficer = await User.findById(officer._id)
      .select("-password")
      .populate("department", "name categories")
      .populate("assignedAreas", "name city");

    return res.status(201).json({
      success: true,
      message: "Officer created successfully.",
      officer: safeOfficer,
    });
  } catch (error) {
    console.error("Create officer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create officer.",
    });
  }
};

// GET /api/admin/officers/:id
const getOfficerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID.",
      });
    }

    const officer = await User.findOne({
      _id: id,
      role: "officer",
    })
      .select("-password")
      .populate("department", "name categories")
      .populate("assignedAreas", "name city");

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      officer,
    });
  } catch (error) {
    console.error("Get officer by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch officer.",
    });
  }
};

const updateOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, assignedAreas } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID.",
      });
    }

    const officer = await User.findOne({
      _id: id,
      role: "officer",
    });

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found.",
      });
    }

    // Capture previous values before making changes
    const previousValues = {
      name: officer.name,
      email: officer.email,
      departmentId: officer.department,
      assignedAreaIds: [...officer.assignedAreas],
    };

    // Update name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters.",
        });
      }

      officer.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Valid email is required.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: officer._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }

      officer.email = normalizedEmail;
    }

    // Update department
    if (department !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }

      const departmentExists = await Department.findOne({
        _id: department,
        isActive: true,
      });

      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: "Active department not found.",
        });
      }

      officer.department = department;
    }

    // Update service areas
    if (assignedAreas !== undefined) {
      if (!Array.isArray(assignedAreas)) {
        return res.status(400).json({
          success: false,
          message: "assignedAreas must be an array.",
        });
      }

      for (const areaId of assignedAreas) {
        if (!mongoose.Types.ObjectId.isValid(areaId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid service area ID: ${areaId}`,
          });
        }
      }

      if (assignedAreas.length > 0) {
        const areaCount = await ServiceArea.countDocuments({
          _id: { $in: assignedAreas },
          isActive: true,
        });

        if (areaCount !== assignedAreas.length) {
          return res.status(400).json({
            success: false,
            message: "One or more service areas are invalid or inactive.",
          });
        }
      }

      officer.assignedAreas = assignedAreas;
    }

    await officer.save();

    // Determine which fields changed
    const changedFields = [];

    if (previousValues.name !== officer.name) {
      changedFields.push("name");
    }

    if (previousValues.email !== officer.email) {
      changedFields.push("email");
    }

    if (
      previousValues.departmentId?.toString() !== officer.department?.toString()
    ) {
      changedFields.push("department");
    }

    const previousAreas = previousValues.assignedAreaIds
      .map((id) => id.toString())
      .sort();

    const currentAreas = officer.assignedAreas
      .map((id) => id.toString())
      .sort();

    if (JSON.stringify(previousAreas) !== JSON.stringify(currentAreas)) {
      changedFields.push("assignedAreas");
    }

    // Create audit log
    await createAuditLog({
      req,
      actor: req.user,
      action: "officer.updated",
      entityType: "User",
      entityId: officer._id,
      details: {
        changedFields,
        previous: {
          name: previousValues.name,
          email: previousValues.email,
          departmentId: previousValues.departmentId,
          assignedAreaIds: previousValues.assignedAreaIds,
        },
        current: {
          name: officer.name,
          email: officer.email,
          departmentId: officer.department,
          assignedAreaIds: officer.assignedAreas,
        },
      },
    });

    const updatedOfficer = await User.findById(officer._id)
      .select("-password")
      .populate("department", "name categories")
      .populate("assignedAreas", "name city");

    return res.status(200).json({
      success: true,
      message: "Officer updated successfully.",
      officer: updatedOfficer,
    });
  } catch (error) {
    console.error("Update officer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update officer.",
    });
  }
};

const updateOfficerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const officer = await User.findOne({
      _id: id,
      role: "officer",
    });

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found.",
      });
    }

    officer.isActive = isActive;

    await officer.save();

    await createAuditLog({
      req,
      actor: req.user,
      action: "officer.status_changed",
      entityType: "User",
      entityId: officer._id,
      details: {
        from: previousStatus,
        to: officer.isActive,
      },
    });

    const updatedOfficer = await User.findById(officer._id)
      .select("-password")
      .populate("department", "name categories")
      .populate("assignedAreas", "name city");

    return res.status(200).json({
      success: true,
      message: `Officer ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      officer: updatedOfficer,
    });
  } catch (error) {
    console.error("Update officer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update officer status.",
    });
  }
};

module.exports = {
  getOfficers,
  createOfficer,
  getOfficerById,
  updateOfficer,
  updateOfficerStatus,
};
