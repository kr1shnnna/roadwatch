const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100,
    },

    categories: [
      {
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
      },
    ],

    description: {
      type: String,
      trim: true,
      maxlength: 500,
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

const Department = mongoose.model(
  "Department",
  departmentSchema
);

module.exports = Department;
