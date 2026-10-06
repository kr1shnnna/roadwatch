const ServiceArea = require("../models/ServiceArea");
const Department = require("../models/Department");

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
        message: "No active department found for this category",
      };
    }

    // 3. Return routing result
    return {
      serviceArea,
      department,
      message: "Report routed successfully",
    };
  } catch (error) {
    console.error("Report routing error:", error);
    throw error;
  }
};

module.exports = {
  routeReport,
};