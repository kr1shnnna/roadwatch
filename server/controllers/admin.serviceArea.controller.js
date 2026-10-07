const mongoose = require("mongoose");

const ServiceArea = require("../models/ServiceArea");

const User = require("../models/User");

const { createAuditLog } = require("../services/audit.service");

const getServiceAreas = async (req, res) => {
  try {
    const { isActive, city } = req.query;

    const filter = {};

    // Validate active filter
    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    // Optional city filter
    if (city !== undefined) {
      if (typeof city !== "string" || !city.trim()) {
        return res.status(400).json({
          success: false,
          message: "City must be a non-empty string.",
        });
      }

      filter.city = city.trim();
    }

    const serviceAreas = await ServiceArea.find(filter)
      .select("-boundary")
      .sort({ city: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: serviceAreas.length,
      serviceAreas,
    });
  } catch (error) {
    console.error("Get service areas error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service areas.",
    });
  }
};


const getServiceAreaById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate service area ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service area ID.",
      });
    }

    const serviceArea = await ServiceArea.findById(id).lean();

    if (!serviceArea) {
      return res.status(404).json({
        success: false,
        message: "Service area not found.",
      });
    }

    // Find officers assigned to this service area
    const officers = await User.find({
      role: "officer",
      assignedAreas: serviceArea._id,
    })
      .select("name email department assignedAreas isActive createdAt")
      .populate("department", "name categories")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      serviceArea: {
        ...serviceArea,
        officers,
        officerCount: officers.length,
      },
    });
  } catch (error) {
    console.error("Get service area by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service area.",
    });
  }
};


const isValidCoordinate = (coordinate) => {
  return (
    Array.isArray(coordinate) &&
    coordinate.length === 2 &&
    Number.isFinite(coordinate[0]) &&
    Number.isFinite(coordinate[1]) &&
    coordinate[0] >= -180 &&
    coordinate[0] <= 180 &&
    coordinate[1] >= -90 &&
    coordinate[1] <= 90
  );
};

const isValidRing = (ring) => {
  if (!Array.isArray(ring) || ring.length < 4) {
    return false;
  }

  if (!ring.every(isValidCoordinate)) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  return (
    first[0] === last[0] &&
    first[1] === last[1]
  );
};

const isValidPolygonCoordinates = (coordinates) => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(isValidRing)
  );
};

const isValidMultiPolygonCoordinates = (coordinates) => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(
      (polygon) =>
        Array.isArray(polygon) &&
        polygon.length > 0 &&
        polygon.every(isValidRing)
    )
  );
};

const validateBoundary = (boundary) => {
  if (!boundary || typeof boundary !== "object") {
    return {
      valid: false,
      message: "Boundary is required.",
    };
  }

  if (
    boundary.type !== "Polygon" &&
    boundary.type !== "MultiPolygon"
  ) {
    return {
      valid: false,
      message: "Boundary type must be Polygon or MultiPolygon.",
    };
  }

  if (!Array.isArray(boundary.coordinates)) {
    return {
      valid: false,
      message: "Boundary coordinates must be an array.",
    };
  }

  if (boundary.type === "Polygon") {
    if (!isValidPolygonCoordinates(boundary.coordinates)) {
      return {
        valid: false,
        message: "Invalid Polygon coordinates.",
      };
    }
  }

  if (boundary.type === "MultiPolygon") {
    if (!isValidMultiPolygonCoordinates(boundary.coordinates)) {
      return {
        valid: false,
        message: "Invalid MultiPolygon coordinates.",
      };
    }
  }

  return {
    valid: true,
  };
};


const createServiceArea = async (req, res) => {
  try {
    const {
      name,
      city,
      boundary,
    } = req.body;

    // ----------------------------------------
    // Validate name
    // ----------------------------------------

    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Service area name is required.",
      });
    }

    // ----------------------------------------
    // Validate city
    // ----------------------------------------

    if (
      !city ||
      typeof city !== "string" ||
      !city.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    // ----------------------------------------
    // Validate boundary
    // ----------------------------------------

    const boundaryValidation =
      validateBoundary(boundary);

    if (!boundaryValidation.valid) {
      return res.status(400).json({
        success: false,
        message: boundaryValidation.message,
      });
    }

    // ----------------------------------------
    // Duplicate service area check
    // ----------------------------------------

    const existingServiceArea =
      await ServiceArea.findOne({
        name: name.trim(),
        city: city.trim(),
      });

    if (existingServiceArea) {
      return res.status(409).json({
        success: false,
        message:
          "A service area with this name already exists in this city.",
      });
    }

    // ----------------------------------------
    // Create service area
    // ----------------------------------------

    const serviceArea = await ServiceArea.create({
      name: name.trim(),
      city: city.trim(),
      boundary: {
        type: boundary.type,
        coordinates: boundary.coordinates,
      },
      source: {
        provider: "roadwatch",
        osmType: null,
        osmId: null,
        displayName: null,
        url: null,
      },
      isActive: true,
    });


    await createAuditLog({
  req,
  actor: req.user,
  action: "service_area.created",
  entityType: "ServiceArea",
  entityId: serviceArea._id,
  details: {
    name: serviceArea.name,
    city: serviceArea.city,
    boundaryType: serviceArea.boundary.type,
    sourceProvider: serviceArea.source?.provider || "roadwatch",
  },
});


    return res.status(201).json({
      success: true,
      message: "Service area created successfully.",
      serviceArea,
    });
  } catch (error) {
    console.error(
      "Create service area error:",
      error
    );

    // Handle MongoDB duplicate-key race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A service area with this name already exists in this city.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create service area.",
    });
  }
};


const updateServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, boundary } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service area ID.",
      });
    }

    // Find service area
    const serviceArea = await ServiceArea.findById(id);

    if (!serviceArea) {
      return res.status(404).json({
        success: false,
        message: "Service area not found.",
      });
    }

    // Capture previous values
    const previousValues = {
      name: serviceArea.name,
      city: serviceArea.city,
      boundaryType: serviceArea.boundary?.type || null,
      sourceProvider:
        serviceArea.source?.provider || null,
    };

    // ----------------------------------------
    // Update name
    // ----------------------------------------

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string.",
        });
      }

      serviceArea.name = name.trim();
    }

    // ----------------------------------------
    // Update city
    // ----------------------------------------

    if (city !== undefined) {
      if (
        typeof city !== "string" ||
        !city.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "City must be a non-empty string.",
        });
      }

      serviceArea.city = city.trim();
    }

    // ----------------------------------------
    // Update boundary
    // ----------------------------------------

    if (boundary !== undefined) {
      // OSM geometry cannot be manually replaced
      if (
        serviceArea.source?.provider ===
        "openstreetmap"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OSM-imported service area boundaries cannot be manually changed. Use the OSM import process to update the boundary.",
        });
      }

      const boundaryValidation =
        validateBoundary(boundary);

      if (!boundaryValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            boundaryValidation.message,
        });
      }

      serviceArea.boundary = {
        type: boundary.type,
        coordinates: boundary.coordinates,
      };

      serviceArea.source = {
        provider: "roadwatch",
        osmType: null,
        osmId: null,
        displayName: null,
        url: null,
      };
    }

    // ----------------------------------------
    // Duplicate name + city check
    // ----------------------------------------

    const duplicate = await ServiceArea.findOne({
      _id: { $ne: serviceArea._id },
      name: serviceArea.name,
      city: serviceArea.city,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A service area with this name already exists in this city.",
      });
    }

    await serviceArea.save();

    // ----------------------------------------
    // Determine changed fields
    // ----------------------------------------

    const changedFields = [];

    if (previousValues.name !== serviceArea.name) {
      changedFields.push("name");
    }

    if (previousValues.city !== serviceArea.city) {
      changedFields.push("city");
    }

    const currentBoundaryType =
      serviceArea.boundary?.type || null;

    if (
      previousValues.boundaryType !==
      currentBoundaryType
    ) {
      changedFields.push("boundary");
    }

    if (
      previousValues.sourceProvider !==
      serviceArea.source?.provider
    ) {
      changedFields.push("source");
    }

    // ----------------------------------------
    // Create audit log
    // ----------------------------------------

    await createAuditLog({
      req,
      actor: req.user,
      action: "service_area.updated",
      entityType: "ServiceArea",
      entityId: serviceArea._id,
      details: {
        changedFields,

        previous: {
          name: previousValues.name,
          city: previousValues.city,
          boundaryType:
            previousValues.boundaryType,
          sourceProvider:
            previousValues.sourceProvider,
        },

        current: {
          name: serviceArea.name,
          city: serviceArea.city,
          boundaryType:
            serviceArea.boundary?.type || null,
          sourceProvider:
            serviceArea.source?.provider || null,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Service area updated successfully.",
      serviceArea,
    });
  } catch (error) {
    console.error(
      "Update service area error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A service area with this name already exists in this city.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update service area.",
    });
  }
};




const updateServiceAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service area ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const serviceArea = await ServiceArea.findById(id);

    if (!serviceArea) {
      return res.status(404).json({
        success: false,
        message: "Service area not found.",
      });
    }

    serviceArea.isActive = isActive;

    await serviceArea.save();

    return res.status(200).json({
      success: true,
      message: `Service area ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      serviceArea,
    });
  } catch (error) {
    console.error(
      "Update service area status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update service area status.",
    });
  }
};


module.exports = {
  getServiceAreas,
  getServiceAreaById,
  createServiceArea,
    updateServiceArea,
    updateServiceAreaStatus,
};
