const mongoose = require("mongoose");

const confirmationSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["resolved", "still_exists"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same citizen from creating duplicate confirmations
confirmationSchema.index(
  {
    report: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

const Confirmation = mongoose.model(
  "Confirmation",
  confirmationSchema
);

module.exports = Confirmation;
