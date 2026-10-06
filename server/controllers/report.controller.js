const Report = require("../models/Report");
const { routeReport } = require("../services/routing.service");
const Confirmation = require("../models/Confirmation");



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
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be valid numbers",
      });
    }

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

    // 1. Save the report first
    const report = await Report.create({
      title: title.trim(),
      description: description.trim(),
      location,
      category,
      priority: priority || "medium",
      reportedBy: req.user._id,
    });

    // 2. Attempt automatic routing
    let routingResult = null;

    try {
      routingResult = await routeReport(report);
    } catch (routingError) {
      console.error(
        "Automatic routing failed:",
        routingError.message
      );
    }

    // 3. Return the report + routing information
    return res.status(201).json({
      success: true,
      message: "Report created successfully",

      report: {
        id: report._id,
        title: report.title,
        description: report.description,
        location: report.location,
        category: report.category,
        priority: report.priority,
        status: report.status,
        reportedBy: report.reportedBy,
        assignedTo: report.assignedTo,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },

      routing: routingResult
        ? {
            message: routingResult.message,

            serviceArea: routingResult.serviceArea
              ? {
                  id: routingResult.serviceArea._id,
                  name: routingResult.serviceArea.name,
                  city: routingResult.serviceArea.city,
                }
              : null,

            department: routingResult.department
              ? {
                  id: routingResult.department._id,
                  name: routingResult.department.name,
                }
              : null,

            officer: routingResult.officer
              ? {
                  id: routingResult.officer._id,
                  name: routingResult.officer.name,
                  email: routingResult.officer.email,
                }
              : null,

            assignment: routingResult.assignment
              ? {
                  id: routingResult.assignment._id,
                  status: routingResult.assignment.status,
                  assignedAt: routingResult.assignment.assignedAt,
                }
              : null,
          }
        : {
            message: "Report created but automatic routing failed",
            serviceArea: null,
            department: null,
            officer: null,
            assignment: null,
          },
    });
  } catch (error) {
    console.error("Create report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating report",
    });
  }
};



const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reportedBy: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name email role");

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get my reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your reports",
    });
  }
};


const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email role");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Ownership check
    if (
      report.reportedBy._id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this report",
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Get report by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching report",
    });
  }
};



const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .select(
        "title description location category status priority reportedBy assignedTo createdAt updatedAt"
      )
      .populate("reportedBy", "name")
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};


const getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // 1. Check required parameters
    if (lat === undefined || lng === undefined || radius === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat, lng, and radius are required",
      });
    }

    // 2. Convert query strings to numbers
    const latitude = Number(lat);
    const longitude = Number(lng);
    const searchRadius = Number(radius);

    // 3. Check that they are valid numbers
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(searchRadius)
    ) {
      return res.status(400).json({
        success: false,
        message: "lat, lng, and radius must be valid numbers",
      });
    }

    // 4. Validate latitude
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    // 5. Validate longitude
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    // 6. Validate radius
    // Radius is measured in meters
    if (searchRadius <= 0) {
      return res.status(400).json({
        success: false,
        message: "Radius must be greater than 0",
      });
    }

    // 7. Find reports near the given coordinates
    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: searchRadius,
        },
      },
    })
      .select(
        "title description location category status priority reportedBy assignedTo createdAt updatedAt"
      )
      .populate("reportedBy", "name")
      .populate("assignedTo", "name role");

    return res.status(200).json({
      success: true,
      count: reports.length,
      radius: searchRadius,
      reports,
    });
  } catch (error) {
    console.error("Get nearby reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching nearby reports",
    });
  }
};



const confirmReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Only the citizen who created the report can confirm it
    if (
      report.reportedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only verify reports that you created",
      });
    }

    // Only resolved reports can be confirmed
    if (report.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message:
          `Report cannot be confirmed because its current status is "${report.status}"`,
      });
    }

    // Prevent duplicate confirmation
    const existingConfirmation =
      await Confirmation.findOne({
        report: report._id,
        user: req.user._id,
      });

    if (existingConfirmation) {
      return res.status(409).json({
        success: false,
        message: "You have already verified this report",
      });
    }

    const confirmation = await Confirmation.create({
      report: report._id,
      user: req.user._id,
      type: "resolved",
    });

    report.status = "confirmed";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report confirmed successfully",
      confirmation,
      report: {
        id: report._id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Confirm report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while confirming report",
    });
  }
};


const reopenReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Only the citizen who created the report can reopen it
    if (
      report.reportedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only reopen reports that you created",
      });
    }

    // Only resolved reports can be reopened
    if (report.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message:
          `Report cannot be reopened because its current status is "${report.status}"`,
      });
    }

    const existingConfirmation =
      await Confirmation.findOne({
        report: report._id,
        user: req.user._id,
      });

    if (existingConfirmation) {
      return res.status(409).json({
        success: false,
        message:
          "You have already verified this report and cannot reopen it",
      });
    }

    await Confirmation.create({
      report: report._id,
      user: req.user._id,
      type: "still_exists",
    });

    report.status = "reopened";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report reopened successfully",
      report: {
        id: report._id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Reopen report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while reopening report",
    });
  }
};



module.exports = {
  createReport,
    getMyReports,
    getReportById,
    getReports,
    getNearbyReports,
    confirmReport,
    reopenReport,
};