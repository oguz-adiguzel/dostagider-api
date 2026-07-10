const mongoose = require("mongoose");

const showcaseRequestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      // hem bireysel (User) hem kurumsal (CorporateUser) olabilir -> referans kontrolü endpoint tarafında yapılır
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: { type: String, default: "" }, // kullanıcı talep notu isteğe bağlı
    adminMessage: { type: String, default: "" }, // admin onay/red sebebi
    processedBy: { type: mongoose.Schema.Types.ObjectId, default: null }, // admin id
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShowcaseRequest", showcaseRequestSchema);
