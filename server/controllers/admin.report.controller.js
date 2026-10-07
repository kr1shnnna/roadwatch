const mongoose = require("mongoose");

const Report = require("../models/Report");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Department = require("../models/Department");
const ServiceArea = require("../models/ServiceArea");
const { createAuditLog } = require("../services/audit.service");

const getAdminReports = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      assigned,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer.",
      });
    }

    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100.",
      });
    }

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assigned === "true") {
      filter.assignedTo = { $ne: null };
    }

    if (assigned === "false") {
      filter.assignedTo = null;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reportedBy", "name email")
        .populate("assignedTo", "name email role")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      success: true,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },

      reports,
    });
  } catch (error) {
    console.error("Get admin reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports.",
    });
  }
};

const getUnassignedReports = async (req, res) => {
  try {
    const reports = await Report.find({
      assignedTo: null,
      status: {
        $in: ["reported", "reopened"],
      },
    })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get unassigned reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned reports.",
    });
  }
};

const getAdminReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const report = await Report.findById(id)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("resolution.resolvedBy", "name email role")
      .populate("reopenHistory.reopenedBy", "name email role")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const assignments = await Assignment.find({
      report: report._id,
    })
      .populate("officer", "name email role")
      .populate("department", "name")
      .populate("serviceArea", "name city")
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      report,
      assignments,
    });
  } catch (error) {
    console.error("Get admin report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch report.",
    });
  }
};

const assignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { officerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID.",
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Report is already assigned. Use the reassign endpoint.",
      });
    }

    const officer = await User.findOne({
      _id: officerId,
      role: "officer",
      isActive: true,
    });

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Active officer not found.",
      });
    }

    const department = await Department.findOne({
      isActive: true,
      categories: report.category,
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "No active department supports this report category.",
      });
    }

    if (
      !officer.department ||
      officer.department.toString() !== department._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Officer does not belong to the department responsible for this report.",
      });
    }

    const serviceArea = await ServiceArea.findOne({
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: report.location.coordinates,
          },
        },
      },
    });

    if (!serviceArea) {
      return res.status(400).json({
        success: false,
        message: "No active service area found for this report.",
      });
    }

    const officerHandlesArea = officer.assignedAreas.some(
      (areaId) => areaId.toString() === serviceArea._id.toString(),
    );

    if (!officerHandlesArea) {
      return res.status(400).json({
        success: false,
        message: "Officer is not assigned to this service area.",
      });
    }

    const assignment = await Assignment.create({
      report: report._id,
      serviceArea: serviceArea._id,
      department: department._id,
      officer: officer._id,
      assignedBy: req.user._id,
      status: "assigned",
    });

    report.assignedTo = officer._id;
    report.status = "assigned";

    await report.save();

    await createAuditLog({
      req,
      actor: req.user,
      action: "report.assigned",
      entityType: "Report",
      entityId: report._id,
      details: {
        officerId: officer._id,
        departmentId: department._id,
        serviceAreaId: serviceArea._id,
        assignmentId: assignment._id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Report assigned successfully.",
      report,
      assignment,
    });
  } catch (error) {
    console.error("Assign report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign report.",
    });
  }
};

const reassignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { officerId, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reassignment reason is required.",
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (!report.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Report is not currently assigned. Use the assign endpoint.",
      });
    }

    const officer = await User.findOne({
      _id: officerId,
      role: "officer",
      isActive: true,
    });

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Active officer not found.",
      });
    }

    const department = await Department.findOne({
      isActive: true,
      categories: report.category,
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "No active department supports this report category.",
      });
    }

    if (
      !officer.department ||
      officer.department.toString() !== department._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Officer does not belong to the department responsible for this report.",
      });
    }

    const serviceArea = await ServiceArea.findOne({
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: report.location.coordinates,
          },
        },
      },
    });

    if (!serviceArea) {
      return res.status(400).json({
        success: false,
        message: "No active service area found for this report.",
      });
    }

    const officerHandlesArea = officer.assignedAreas.some(
      (areaId) => areaId.toString() === serviceArea._id.toString(),
    );

    if (!officerHandlesArea) {
      return res.status(400).json({
        success: false,
        message: "Officer is not assigned to this service area.",
      });
    }

    // Find the current active assignment
    const currentAssignment = await Assignment.findOne({
      report: report._id,
      officer: report.assignedTo,
      status: {
        $in: ["assigned", "accepted", "in_progress"],
      },
    }).sort({ createdAt: -1 });

    // Close the previous assignment
    if (currentAssignment) {
      currentAssignment.status = "rejected";
      currentAssignment.rejectionReason = `Reassigned by admin: ${reason.trim()}`;

      await currentAssignment.save();
    }

    // Create the new assignment
    const newAssignment = await Assignment.create({
      report: report._id,
      serviceArea: serviceArea._id,
      department: department._id,
      officer: officer._id,
      assignedBy: req.user._id,
      status: "assigned",
    });

    report.assignedTo = officer._id;
    report.status = "assigned";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report reassigned successfully.",
      report,
      previousAssignment: currentAssignment,
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Reassign report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reassign report.",
    });
  }
};

module.exports = {
  getAdminReports,
  getUnassignedReports,
  getAdminReportById,
  assignReport,
  reassignReport,
};
