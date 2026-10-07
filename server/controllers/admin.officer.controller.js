const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Department = require("../models/Department");
const ServiceArea = require("../models/ServiceArea");


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
    const {
      name,
      email,
      password,
      department,
      assignedAreas = [],
    } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, and department are required.",
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
          message:
            "One or more service areas are invalid or inactive.",
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

module.exports = {
  getOfficers,
  createOfficer,
};
