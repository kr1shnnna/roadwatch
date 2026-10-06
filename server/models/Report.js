const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    category: {
      type: String,
      enum: [
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
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "reported",
        "verified",
        "assigned",
        "accepted",
        "in_progress",
        "resolved",
        "confirmed",
        "reopened",
        "rejected",
      ],
      default: "reported",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolution: {
  note: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: null,
  },

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  resolvedAt: {
    type: Date,
    default: null,
  },
},

  },
  {
    timestamps: true,
  }
);

// Geospatial index for nearby issue searches
reportSchema.index({
  location: "2dsphere",
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;