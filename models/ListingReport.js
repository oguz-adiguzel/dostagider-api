const mongoose = require("mongoose");

const listingReportSchema = new mongoose.Schema(
  {
    // Şikayet edilen ilan
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      required: true,
    },

    // Şikayet eden kullanıcı
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // User veya CorporateUser
    userModel: {
      type: String,
      enum: ["User", "CorporateUser"],
      required: true,
    },

    // Şikayet nedeni
    reason: {
      type: String,
      enum: [
        "fake_listing",
        "wrong_information",
        "fraud",
        "duplicate",
        "inappropriate",
        "other",
      ],
      required: true,
    },

    // Kullanıcının yazdığı açıklama
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // Admin inceleme durumu
    status: {
      type: String,
      enum: [
        "pending",
        "reviewing",
        "resolved",
        "rejected",
      ],
      default: "pending",
    },

    // Admin notu
    adminNote: {
      type: String,
      default: "",
    },

    // İnceleyen admin
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WebUser",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


listingReportSchema.index(
  {
    listing: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "ListingReport",
  listingReportSchema
);

