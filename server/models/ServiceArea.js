const mongoose = require("mongoose");

const serviceAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },

      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index
serviceAreaSchema.index({
  boundary: "2dsphere",
});

const ServiceArea = mongoose.model(
  "ServiceArea",
  serviceAreaSchema
);

module.exports = ServiceArea;
