const ServiceArea = require("../models/ServiceArea");
const Department = require("../models/Department");
const User = require("../models/User");
const Assignment = require("../models/Assignment");

const routeReport = async (report) => {
  try {
    const { location, category } = report;

    if (
      !location ||
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      throw new Error("Report has an invalid location");
    }

    const [longitude, latitude] = location.coordinates;

    // 1. Find the service area containing the report location
    const serviceArea = await ServiceArea.findOne({
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
    });

    if (!serviceArea) {
      return {
        serviceArea: null,
        department: null,
        officer: null,
        assignment: null,
        message: "No active service area found for this location",
      };
    }

    // 2. Find the department responsible for this category
    const department = await Department.findOne({
      isActive: true,
      categories: category,
    });

    if (!department) {
      return {
        serviceArea,
        department: null,
        officer: null,
        assignment: null,
        message: "No active department found for this category",
      };
    }

    // 3. Find an eligible active officer
    const officer = await User.findOne({
      role: "officer",
      isActive: true,
      department: department._id,
      assignedAreas: serviceArea._id,
    });

    if (!officer) {
      return {
        serviceArea,
        department,
        officer: null,
        assignment: null,
        message:
          "No active officer found for this service area and department",
      };
    }

    // 4. Create a NEW assignment
    // The previous assignment remains in the database
    // as historical evidence of the previous resolution attempt.
    const assignment = await Assignment.create({
      report: report._id,
      serviceArea: serviceArea._id,
      department: department._id,
      officer: officer._id,
      status: "assigned",
    });

    // 5. Update the report to the new assignment
    report.assignedTo = officer._id;
    report.status = "assigned";

    await report.save();

    return {
      serviceArea,
      department,
      officer,
      assignment,
      message: "Report routed and assigned successfully",
    };
  } catch (error) {
    console.error("Report routing error:", error);
    throw error;
  }
};

module.exports = {
  routeReport,
};
