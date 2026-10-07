const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

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

    // Original evidence uploaded by the citizen
    evidenceImages: {
      type: [imageSchema],
      default: [],
    },

    // Officer resolution evidence
    resolution: {
      note: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      images: {
        type: [imageSchema],
        default: [],
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

    // History of citizen reopen actions
    reopenHistory: [
      {
        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: null,
        },

        images: {
          type: [imageSchema],
          default: [],
        },

        reopenedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        reopenedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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