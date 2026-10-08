const Report = require("../models/Report");

const REPORT_STATUSES = [
  "reported",
  "verified",
  "assigned",
  "accepted",
  "in_progress",
  "resolved",
  "confirmed",
  "reopened",
  "rejected",
];

const REPORT_CATEGORIES = [
  "pothole",
  "broken_road",
  "streetlight",
  "traffic_signal",
  "waterlogging",
  "open_manhole",
  "road_sign",
  "road_debris",
  "drainage",
  "other",
];

const REPORT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
];

const getAnalyticsOverview = async (req, res) => {
  try {
    const [
      totalReports,
      statusResults,
      categoryResults,
      priorityResults,
      resolutionStats,
    ] = await Promise.all([
      Report.countDocuments(),

      Report.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Report.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),

      Report.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),

      Report.aggregate([
        {
          $match: {
            "resolution.resolvedAt": {
              $ne: null,
            },
          },
        },
        {
          $project: {
            resolutionTimeMs: {
              $subtract: [
                "$resolution.resolvedAt",
                "$createdAt",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averageResolutionTimeMs: {
              $avg: "$resolutionTimeMs",
            },
            resolvedCount: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    // ----------------------------------------
    // Format status counts
    // ----------------------------------------

    const statusBreakdown = {};

    REPORT_STATUSES.forEach((status) => {
      statusBreakdown[status] = 0;
    });

    statusResults.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    // ----------------------------------------
    // Format category counts
    // ----------------------------------------

    const categoryBreakdown = {};

    REPORT_CATEGORIES.forEach((category) => {
      categoryBreakdown[category] = 0;
    });

    categoryResults.forEach((item) => {
      categoryBreakdown[item._id] = item.count;
    });

    // ----------------------------------------
    // Format priority counts
    // ----------------------------------------

    const priorityBreakdown = {};

    REPORT_PRIORITIES.forEach((priority) => {
      priorityBreakdown[priority] = 0;
    });

    priorityResults.forEach((item) => {
      priorityBreakdown[item._id] = item.count;
    });

    const resolvedCount =
      statusBreakdown.resolved +
      statusBreakdown.confirmed;

    const reopenedCount =
      statusBreakdown.reopened;

    const rejectedCount =
      statusBreakdown.rejected;

    const resolutionRate =
      totalReports > 0
        ? Number(
            ((resolvedCount / totalReports) * 100).toFixed(2)
          )
        : 0;

    const averageResolutionTimeMs =
      resolutionStats[0]?.averageResolutionTimeMs || 0;

    const averageResolutionTimeHours =
      Number(
        (
          averageResolutionTimeMs /
          (1000 * 60 * 60)
        ).toFixed(2)
      );

    return res.status(200).json({
      success: true,

      overview: {
        totalReports,

        resolvedCount,

        reopenedCount,

        rejectedCount,

        resolutionRate,
      },

      statusBreakdown,

      categoryBreakdown,

      priorityBreakdown,

      resolution: {
        resolvedCount:
          resolutionStats[0]?.resolvedCount || 0,

        averageResolutionTimeHours,
      },
    });
  } catch (error) {
    console.error(
      "Get analytics overview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview.",
    });
  }
};

module.exports = {
  getAnalyticsOverview,
};
