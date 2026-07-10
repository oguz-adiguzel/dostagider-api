const mongoose = require("mongoose");

const viewTrackSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      required: true,
    },
    ip: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// aynı ip aynı ilanı sadece 1 kez kayıt edebilir
// viewTrackSchema.index({ listingId: 1, ip: 1 }, { unique: true });
viewTrackSchema.index(
  { viewedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 } // 24 saat
);


module.exports = mongoose.model("ViewTrack", viewTrackSchema);
