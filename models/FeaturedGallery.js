const mongoose = require("mongoose");

const featuredGallerySchema = new mongoose.Schema(
  {
    corporateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CorporateUser",
      required: true,
      unique: true,
    },

    packageDays: {
      type: Number,
      enum: [7, 14, 30],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "expired", "rejected"],
      default: "pending",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeaturedGallery", featuredGallerySchema);
