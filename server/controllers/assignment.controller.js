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
    if (
      assignment.officer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to accept this assignment",
      });
    }

    // Only assigned assignments can be accepted
    if (assignment.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message:
          `Assignment cannot be accepted because its current status is "${assignment.status}"`,
      });
    }

    // Update assignment
    assignment.status = "accepted";
    assignment.acceptedAt = new Date();

    await assignment.save();

    // Update corresponding report
    const Report = require("../models/Report");

    const report = await Report.findById(
      assignment.report
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment exists but the associated report was not found",
      });
    }

    // Keep report status synchronized
    if (report.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message:
          `Report cannot be accepted because its current status is "${report.status}"`,
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
    if (
      assignment.officer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to start this assignment",
      });
    }

    // Only accepted assignments can be started
    if (assignment.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message:
          `Assignment cannot be started because its current status is "${assignment.status}"`,
      });
    }

    const Report = require("../models/Report");

    const report = await Report.findById(
      assignment.report
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment exists but the associated report was not found",
      });
    }

    // Report and assignment must be synchronized
    if (report.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message:
          `Report cannot be started because its current status is "${report.status}"`,
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


module.exports = {
  getMyAssignments,
    acceptAssignment,
    startAssignment,
};
