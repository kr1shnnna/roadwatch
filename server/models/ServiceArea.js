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
        enum: ["Polygon", "MultiPolygon"],
        required: true,
        default: "Polygon",
      },

      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },

    source: {
      provider: {
        type: String,
        default: "openstreetmap",
      },

      osmType: {
        type: String,
        enum: ["node", "way", "relation"],
        default: null,
      },

      osmId: {
        type: String,
        default: null,
      },

      displayName: {
        type: String,
        default: null,
      },

      url: {
        type: String,
        default: null,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

serviceAreaSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);