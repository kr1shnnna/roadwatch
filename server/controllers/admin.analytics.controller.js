const Report = require("../models/Report");
const User = require("../models/User");
const Department = require("../models/Department");
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



const getOfficerAnalytics = async (req, res) => {
  try {
    const officerStats = await User.aggregate([
      {
        $match: {
          role: "officer",
        },
      },

      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },

      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "assignments",
          let: {
            officerId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$officer", "$$officerId"],
                },
              },
            },

            {
              $group: {
                _id: null,

                totalAssignments: {
                  $sum: 1,
                },

                activeAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [
                            "assigned",
                            "accepted",
                            "in_progress",
                          ],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                completedAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          "completed",
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                rejectedAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          "rejected",
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                averageResolutionTimeMs: {
                  $avg: {
                    $cond: [
                      {
                        $and: [
                          {
                            $ne: [
                              "$assignedAt",
                              null,
                            ],
                          },
                          {
                            $ne: [
                              "$completedAt",
                              null,
                            ],
                          },
                        ],
                      },
                      {
                        $subtract: [
                          "$completedAt",
                          "$assignedAt",
                        ],
                      },
                      null,
                    ],
                  },
                },
              },
            },
          ],
          as: "assignmentStats",
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isActive: 1,

          department: {
            _id: "$department._id",
            name: "$department.name",
          },

          stats: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$assignmentStats",
                  0,
                ],
              },
              {
                totalAssignments: 0,
                activeAssignments: 0,
                completedAssignments: 0,
                rejectedAssignments: 0,
                averageResolutionTimeMs: 0,
              },
            ],
          },
        },
      },

      {
        $sort: {
          "stats.activeAssignments": -1,
          name: 1,
        },
      },
    ]);

    const officers = officerStats.map((officer) => {
      const averageResolutionTimeMs =
        officer.stats.averageResolutionTimeMs || 0;

      return {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        isActive: officer.isActive,

        department: officer.department,

        stats: {
          totalAssignments:
            officer.stats.totalAssignments,

          activeAssignments:
            officer.stats.activeAssignments,

          completedAssignments:
            officer.stats.completedAssignments,

          rejectedAssignments:
            officer.stats.rejectedAssignments,

          averageResolutionTimeHours: Number(
            (
              averageResolutionTimeMs /
              (1000 * 60 * 60)
            ).toFixed(2)
          ),
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: officers.length,
      officers,
    });
  } catch (error) {
    console.error(
      "Get officer analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch officer analytics.",
    });
  }
};




const getDepartmentAnalytics = async (req, res) => {
  try {
    const departmentStats = await Department.aggregate([
      {
        $lookup: {
          from: "assignments",
          let: {
            departmentId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$department",
                    "$$departmentId",
                  ],
                },
              },
            },

            {
              $group: {
                _id: null,

                totalAssignments: {
                  $sum: 1,
                },

                activeAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [
                            "assigned",
                            "accepted",
                            "in_progress",
                          ],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                completedAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          "completed",
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                rejectedAssignments: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          "rejected",
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                averageResolutionTimeMs: {
                  $avg: {
                    $cond: [
                      {
                        $and: [
                          {
                            $ne: [
                              "$assignedAt",
                              null,
                            ],
                          },
                          {
                            $ne: [
                              "$completedAt",
                              null,
                            ],
                          },
                        ],
                      },
                      {
                        $subtract: [
                          "$completedAt",
                          "$assignedAt",
                        ],
                      },
                      null,
                    ],
                  },
                },
              },
            },
          ],

          as: "assignmentStats",
        },
      },

      {
        $lookup: {
          from: "users",
          let: {
            departmentId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$department",
                        "$$departmentId",
                      ],
                    },
                    {
                      $eq: [
                        "$role",
                        "officer",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "officerCount",
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          isActive: 1,

          officerCount: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$officerCount.count",
                  0,
                ],
              },
              0,
            ],
          },

          stats: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$assignmentStats",
                  0,
                ],
              },
              {
                totalAssignments: 0,
                activeAssignments: 0,
                completedAssignments: 0,
                rejectedAssignments: 0,
                averageResolutionTimeMs: 0,
              },
            ],
          },
        },
      },

      {
        $sort: {
          "stats.activeAssignments": -1,
          name: 1,
        },
      },
    ]);

    const departments = departmentStats.map(
      (department) => {
        const averageResolutionTimeMs =
          department.stats
            .averageResolutionTimeMs || 0;

        return {
          _id: department._id,

          name: department.name,

          isActive: department.isActive,

          officerCount:
            department.officerCount,

          stats: {
            totalAssignments:
              department.stats.totalAssignments,

            activeAssignments:
              department.stats.activeAssignments,

            completedAssignments:
              department.stats.completedAssignments,

            rejectedAssignments:
              department.stats.rejectedAssignments,

            averageResolutionTimeHours:
              Number(
                (
                  averageResolutionTimeMs /
                  (1000 * 60 * 60)
                ).toFixed(2)
              ),
          },
        };
      }
    );

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error(
      "Get department analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch department analytics.",
    });
  }
};



const getReportTrends = async (req, res) => {
  try {
    const {
      period = "30d",
      groupBy = "day",
    } = req.query;

    const allowedPeriods = [
      "7d",
      "30d",
      "90d",
      "1y",
    ];

    const allowedGroupBy = [
      "day",
      "week",
      "month",
    ];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Use 7d, 30d, 90d, or 1y.",
      });
    }

    if (!allowedGroupBy.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid groupBy. Use day, week, or month.",
      });
    }

    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case "7d":
        startDate.setDate(
          startDate.getDate() - 6
        );
        break;

      case "30d":
        startDate.setDate(
          startDate.getDate() - 29
        );
        break;

      case "90d":
        startDate.setDate(
          startDate.getDate() - 89
        );
        break;

      case "1y":
        startDate.setFullYear(
          startDate.getFullYear() - 1
        );
        break;
    }

    let dateFormat;

    switch (groupBy) {
      case "day":
        dateFormat = "%Y-%m-%d";
        break;

      case "week":
        dateFormat = "%G-W%V";
        break;

      case "month":
        dateFormat = "%Y-%m";
        break;
    }

    const trends = await Report.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $project: {
          period: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },

          status: 1,
        },
      },

      {
        $group: {
          _id: "$period",

          totalReports: {
            $sum: 1,
          },

          resolvedReports: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "resolved",
                      "confirmed",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },

          reopenedReports: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "reopened",
                  ],
                },
                1,
                0,
              ],
            },
          },

          rejectedReports: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "rejected",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },

      {
        $project: {
          _id: 0,

          period: "$_id",

          totalReports: 1,

          resolvedReports: 1,

          reopenedReports: 1,

          rejectedReports: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,

      period,

      groupBy,

      startDate,

      endDate: now,

      trends,
    });
  } catch (error) {
    console.error(
      "Get report trends error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch report trends.",
    });
  }
};


module.exports = {
  getAnalyticsOverview,
  getOfficerAnalytics,
  getDepartmentAnalytics,
  getReportTrends,
};
