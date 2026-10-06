const Report = require("../models/Report");

const createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      category,
      priority,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !location ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, location, and category are required",
      });
    }

    // Validate GeoJSON location
    if (
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Location must be a GeoJSON Point with [longitude, latitude]",
      });
    }

    const [longitude, latitude] = location.coordinates;

    // Validate coordinate ranges
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid geographic coordinates",
      });
    }

    const report = await Report.create({
      title,
      description,
      location,
      category,
      priority: priority || "medium",

      // Never take reportedBy from req.body
      reportedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    console.error("Create report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating report",
    });
  }
};

module.exports = {
  createReport,
};