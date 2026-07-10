const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    userModel: {
      type: String,
      enum: ["User", "CorporateUser", "Admin"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "listing",
        "listing_expiring",
        "listing_expired",
        "system",
        "admin",
        "favorite",
        "message",
        "favorite_price_drop"
      ],
      default: "system",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
