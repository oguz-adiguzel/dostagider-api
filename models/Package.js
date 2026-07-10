const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "listing",        // ilan yayınlama / yeniden yayınlama
        "showcase",       // vitrin
        "corporate",      // kurumsal abonelik
        "listingLimit",   // ekstra ilan hakkı
      ],
      required: true,
    },

    duration: {
      type: Number, // gün cinsinden
      required: true,
    },

    price: {
      type: Number, // ₺ yerine number (frontend formatlar)
      required: true,
    },

    currency: {
      type: String,
      default: "TRY",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number, // frontend sıralama
      default: 0,
    },
  },
  { timestamps: true }
);

// indexler
packageSchema.index({ type: 1, isActive: 1 });
packageSchema.index({ order: 1 });

module.exports = mongoose.model("Package", packageSchema);