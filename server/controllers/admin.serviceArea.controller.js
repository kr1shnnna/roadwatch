const mongoose = require("mongoose");

const ServiceArea = require("../models/ServiceArea");

const getServiceAreas = async (req, res) => {
  try {
    const { isActive, city } = req.query;

    const filter = {};

    // Validate active filter
    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    // Optional city filter
    if (city !== undefined) {
      if (typeof city !== "string" || !city.trim()) {
        return res.status(400).json({
          success: false,
          message: "City must be a non-empty string.",
        });
      }

      filter.city = city.trim();
    }

    const serviceAreas = await ServiceArea.find(filter)
      .select("-boundary")
      .sort({ city: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: serviceAreas.length,
      serviceAreas,
    });
  } catch (error) {
    console.error("Get service areas error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service areas.",
    });
  }
};

module.exports = {
  getServiceAreas,
};
