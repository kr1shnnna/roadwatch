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

module.exports = {
  getMyAssignments,
};
