const Assignment = require("../models/Assignment");

const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      officer: req.user._id,
    })
      .populate({
        path: "report",
        populate: {
          path: "reportedBy",
          select: "name",
        },
      })
      .populate("serviceArea", "name city")
      .populate("department", "name")
      .populate("officer", "name email")
      .sort({ assignedAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get my assignments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching assignments",
    });
  }
};

const acceptAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Make sure the assignment belongs to the logged-in officer
    if (assignment.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to accept this assignment",
      });
    }

    // Only assigned assignments can be accepted
    if (assignment.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Assignment cannot be accepted because its current status is "${assignment.status}"`,
      });
    }

    // Update assignment
    assignment.status = "accepted";
    assignment.acceptedAt = new Date();

    await assignment.save();

    // Update corresponding report
    const Report = require("../models/Report");

    const report = await Report.findById(assignment.report);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Assignment exists but the associated report was not found",
      });
    }

    // Keep report status synchronized
    if (report.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Report cannot be accepted because its current status is "${report.status}"`,
      });
    }

    report.status = "accepted";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Assignment accepted successfully",
      assignment,
      report: {
        id: report._id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Accept assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while accepting assignment",
    });
  }
};

const startAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Only the assigned officer can start the assignment
    if (assignment.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to start this assignment",
      });
    }

    // Only accepted assignments can be started
    if (assignment.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Assignment cannot be started because its current status is "${assignment.status}"`,
      });
    }

    const Report = require("../models/Report");

    const report = await Report.findById(assignment.report);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Assignment exists but the associated report was not found",
      });
    }

    // Report and assignment must be synchronized
    if (report.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Report cannot be started because its current status is "${report.status}"`,
      });
    }

    // Update assignment
    assignment.status = "in_progress";

    await assignment.save();

    // Update report
    report.status = "in_progress";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Assignment started successfully",

      assignment: {
        id: assignment._id,
        status: assignment.status,
        officer: assignment.officer,
      },

      report: {
        id: report._id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Start assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while starting assignment",
    });
  }
};

const resolveAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;

    const resolutionImages = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    if (!resolutionNote || !resolutionNote.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resolution note is required",
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Only the assigned officer can resolve it
    if (assignment.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to resolve this assignment",
      });
    }

    // Only an in-progress assignment can be resolved
    if (assignment.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Assignment cannot be resolved because its current status is "${assignment.status}"`,
      });
    }

    const Report = require("../models/Report");

    const report = await Report.findById(assignment.report);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Assignment exists but the associated report was not found",
      });
    }

    // Report must also be in progress
    if (report.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Report cannot be resolved because its current status is "${report.status}"`,
      });
    }

    // Update assignment
    assignment.status = "completed";
    assignment.completedAt = new Date();

    await assignment.save();

    // Update report
    report.status = "resolved";

    report.resolution = {
      note: resolutionNote,
      images: resolutionImages,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    };

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Assignment resolved successfully",

      assignment: {
        id: assignment._id,
        status: assignment.status,
        completedAt: assignment.completedAt,
      },

      report: {
        id: report._id,
        status: report.status,
        resolution: report.resolution,
      },
    });
  } catch (error) {
    console.error("Resolve assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resolving assignment",
    });
  }
};

const rejectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate rejection reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Only the assigned officer can reject it
    if (assignment.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reject this assignment",
      });
    }

    // Only assigned assignments can be rejected
    if (assignment.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Assignment cannot be rejected because its current status is "${assignment.status}"`,
      });
    }

    const Report = require("../models/Report");

    const report = await Report.findById(assignment.report);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Assignment exists but the associated report was not found",
      });
    }

    // Report must also still be assigned
    if (report.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Report cannot be rejected because its current status is "${report.status}"`,
      });
    }

    // Update assignment
    assignment.status = "rejected";
    assignment.rejectionReason = reason.trim();

    await assignment.save();

    // Update report
    report.status = "rejected";

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Assignment rejected successfully",

      assignment: {
        id: assignment._id,
        status: assignment.status,
        rejectionReason: assignment.rejectionReason,
      },

      report: {
        id: report._id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Reject assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while rejecting assignment",
    });
  }
};

module.exports = {
  getMyAssignments,
  acceptAssignment,
  startAssignment,
  resolveAssignment,
  rejectAssignment,
};
