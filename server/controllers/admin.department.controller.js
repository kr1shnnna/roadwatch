const mongoose = require("mongoose");

const Department = require("../models/Department");

const User = require("../models/User");

const getDepartments = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    const departments = await Department.find(filter)
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments.",
    });
  }
};


const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
      });
    }

    const department = await Department.findById(id).lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const officers = await User.find({
      role: "officer",
      department: department._id,
    })
      .select("name email assignedAreas isActive createdAt")
      .populate("assignedAreas", "name city")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      department: {
        ...department,
        officers,
        officerCount: officers.length,
      },
    });
  } catch (error) {
    console.error("Get department by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch department.",
    });
  }
};


module.exports = {
  getDepartments,
    getDepartmentById,
};