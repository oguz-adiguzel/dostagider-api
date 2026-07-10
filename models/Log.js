// models/Log.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error", "debug"], default: "info" },
    type: { type: String, required: true }, // örn. "ilan.create", "auth.login"
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed }, // ekstra data (request body, stack, vs)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    corporateUserId: { type: mongoose.Schema.Types.ObjectId, ref: "CorporateUser", default: null },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "CarListing", default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

// index sorgular için faydalı
logSchema.index({ createdAt: -1 });
logSchema.index({ type: 1, level: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ listingId: 1 });

module.exports = mongoose.model("Log", logSchema);
