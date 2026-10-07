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



const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { categories, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    // Categories are optional, but if provided they must be an array
    if (categories !== undefined) {
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Categories must be a non-empty array.",
        });
      }

      department.categories = categories;
    }

    // Description is optional
    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string or null.",
        });
      }

      department.description =
        typeof description === "string"
          ? description.trim()
          : null;
    }

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    console.error("Update department error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update department.",
    });
  }
};


const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate department ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
      });
    }

    // Validate isActive
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    department.isActive = isActive;

    await department.save();

    return res.status(200).json({
      success: true,
      message: `Department ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      department,
    });
  } catch (error) {
    console.error("Update department status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update department status.",
    });
  }
};


module.exports = {
  getDepartments,
    getDepartmentById,
    updateDepartment,
    updateDepartmentStatus,
};