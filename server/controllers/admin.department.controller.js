const mongoose = require("mongoose");

const Department = require("../models/Department");

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

module.exports = {
  getDepartments,
};