const mongoose = require("mongoose");

const BrandPriceListSchema = new mongoose.Schema(
  {
    // 🔹 MARKA BİLGİLERİ
    brand: {
      type: String,
      required: true,
      unique: true, // Toyota
    },

    slug: {
      type: String,
      required: true,
      unique: true, // toyota
    },

    logoUrl: {
      type: String,
      required: true, // Cloudinary / CDN
    },

    logoPublicId: {
      type: String,
      required: true, // Cloudinary / CDN
    },
    sourceUrl: {
      type: String,
      required: true, // resmi fiyat listesi
    },
    sourceHash: {
      type: String,
    },

    sourceContentLength: {
      type: Number,
    },

    sourceLastCheckedAt: {
      type: Date,
    },

    sourceChangedAt: {
      type: Date,
    },

    lastCheckedAt: {
      type: Date,
    },

    hasPossibleUpdate: {
      type: Boolean,
      default: false,
    },

    // 🔹 MODELLER
    models: [
      {
        name: {
          type: String,
          required: true, // Corolla
        },

        slug: {
          type: String,
          required: true, // corolla
        },

        photoUrl: {
          type: String,
          required: true, // model görseli
        },
        photoPublicId: {
          type: String,
          required: true, // model görseli
        },

        packages: [
          {
            name: {
              type: String,
              required: true, // 1.5 Vision
            },

            fuelType: {
              type: String,
            },

            price: {
              type: Number,
              required: true,
            },

            currency: {
              type: String,
              default: "TRY",
            },

            lastUpdatedAt: {
              type: Date,
              required: true,
            },

            isActive: {
              type: Boolean,
              default: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandPriceList", BrandPriceListSchema);
