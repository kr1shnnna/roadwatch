const Report = require("../models/Report");
const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");

const getDashboard = async (req, res) => {
  try {
    const [
      totalReports,
      reportedReports,
      assignedReports,
      inProgressReports,
      resolvedReports,
      confirmedReports,
      reopenedReports,
      rejectedReports,
      unassignedReports,
      unreadNotifications,
      recentReports,
      recentAssignments,
    ] = await Promise.all([
      // Total reports
      Report.countDocuments(),

      // Reported
      Report.countDocuments({
        status: "reported",
      }),

      // Assigned
      Report.countDocuments({
        status: "assigned",
      }),

      // In progress
      Report.countDocuments({
        status: "in_progress",
      }),

      // Resolved
      Report.countDocuments({
        status: "resolved",
      }),

      // Confirmed
      Report.countDocuments({
        status: "confirmed",
      }),

      // Reopened
      Report.countDocuments({
        status: "reopened",
      }),

      // Rejected
      Report.countDocuments({
        status: "rejected",
      }),

      // Reports without an officer
      Report.countDocuments({
        assignedTo: null,
      }),

      // Unread notifications for this admin
      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),

      // Recent reports
      Report.find()
        .select(
          "title category status priority reportedBy assignedTo createdAt updatedAt"
        )
        .populate("reportedBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),

      // Recent assignments
      Assignment.find()
        .select(
          "report officer department serviceArea status assignedAt acceptedAt completedAt updatedAt"
        )
        .populate("report", "title category status")
        .populate("officer", "name email")
        .populate("department", "name")
        .populate("serviceArea", "name city")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Build a unified recent activity feed
    const recentActivity = [
      ...recentReports.map((report) => ({
        type: "report",
        id: report._id,
        title: report.title,
        category: report.category,
        status: report.status,
        priority: report.priority,
        reportedBy: report.reportedBy,
        assignedTo: report.assignedTo,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),

      ...recentAssignments.map((assignment) => ({
        type: "assignment",
        id: assignment._id,
        report: assignment.report,
        officer: assignment.officer,
        department: assignment.department,
        serviceArea: assignment.serviceArea,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        acceptedAt: assignment.acceptedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.updatedAt) -
          new Date(a.updatedAt)
      )
      .slice(0, 20);

    return res.status(200).json({
      success: true,

      summary: {
        totalReports,
        reportedReports,
        assignedReports,
        inProgressReports,
        resolvedReports,
        confirmedReports,
        reopenedReports,
        rejectedReports,
        unassignedReports,
        unreadNotifications,
      },

      recentActivity,
    });
  } catch (error) {
    console.error(
      "Get admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
    });
  }
};

module.exports = {
  getDashboard,
};
