const mongoose = require("mongoose");
const User = require("../models/User");
const CorporateUser = require("../models/CorporateUser");
const sendNotification = require("../utils/sendNotification");

const carListingSchema = new mongoose.Schema(
  {
    ilanNo: {
      type: String,
      required: true,
      unique: true,
    },
    baslik: {
      type: String,
      required: true,
    },
    sehir: {
      type: String,
      required: true,
    },
    ilce: {
      type: String,
      required: true,
    },
    mahalle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    priceHistory: [
      {
        price: {
          type: String,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    variant1: String,
    variant2: String,
    variant3: String,

    ilanTarihi: {
      type: Date,
      default: Date.now,
    },
    aracYili: {
      type: Number,
      required: true,
    },
    yakit: {
      type: String,
      required: true,
      enum: ["Benzin", "Dizel", "Hybrid", "Elektrik", "LPG", "Diğer"],
    },
    vites: {
      type: String,
      required: true,
      enum: ["Manuel", "Otomatik", "Yarı Otomatik"],
    },
    km: {
      type: Number,
      required: true,
    },
    kasaTipi: {
      type: String,
      required: true,
    },
    garanti: {
      type: Boolean,
      default: false,
    },
    agirHasarKaydi: {
      type: Boolean,
      default: false,
    },
    isEV: {
      type: Boolean,
      default: false,
    },
    takas: {
      type: Boolean,
      default: false,
    },
    aciklama: {
      type: String,
    },
    gorseller: {
      type: [String],
      default: [],
    },
    noExpertiz: {
      type: Boolean,
      default: false,
    },
    teknikOzellikler: {
      guvenlik: {
        abs: { type: Boolean, default: false },
        aeb: { type: Boolean, default: false },
        bas: { type: Boolean, default: false },
        cocukKilidi: { type: Boolean, default: false },
        distronic: { type: Boolean, default: false },
        geceGorusSistemi: { type: Boolean, default: false },
        havaYastıgıSürücü: { type: Boolean, default: false },
        havaYastıgıYolcu: { type: Boolean, default: false },
        immobilizer: { type: Boolean, default: false },
        isofix: { type: Boolean, default: false },
        korNokta: { type: Boolean, default: false },
        merkeziKilit: { type: Boolean, default: false },
        seritTakip: { type: Boolean, default: false },
        yokusKalkis: { type: Boolean, default: false },
        yorgunlukTespit: { type: Boolean, default: false },
      },
      icDonanim: {
        hidrolikDireksiyon: { type: Boolean, default: false },
        ucuncuSiraKoltuk: { type: Boolean, default: false },
        deriKoltuk: { type: Boolean, default: false },
        kumasKoltuk: { type: Boolean, default: false },
        elektrikliCam: { type: Boolean, default: false },
        klima: { type: Boolean, default: false },
        otmKararanDikiz: { type: Boolean, default: false },
        onGorüsKamera: { type: Boolean, default: false },
        onKolDayama: { type: Boolean, default: false },
        anahtarsizGiris: { type: Boolean, default: false },
        fonksiyonelDireksiyon: { type: Boolean, default: false },
        isitmaliDireksiyon: { type: Boolean, default: false },
        elektrikliKoltuk: { type: Boolean, default: false },
        isitmaliKoltuk: { type: Boolean, default: false },
        sogutmaliKoltuk: { type: Boolean, default: false },
        hizSabitleme: { type: Boolean, default: false },
        sogutmaliTorpido: { type: Boolean, default: false },
        yolBilgisayari: { type: Boolean, default: false },
        headUp: { type: Boolean, default: false },
        startStop: { type: Boolean, default: false },
        geriGorus: { type: Boolean, default: false },
      },
      dısDonanim: {
        ayaklaAcilanBagaj: { type: Boolean, default: false },
        hardtop: { type: Boolean, default: false },
        adaptifFar: { type: Boolean, default: false },
        elektrikliAyna: { type: Boolean, default: false },
        isitmaliAyna: { type: Boolean, default: false },
        hafizaliAyna: { type: Boolean, default: false },
        parkSensorüArka: { type: Boolean, default: false },
        parkSensorüOn: { type: Boolean, default: false },
        parkAsistani: { type: Boolean, default: false },
        sunroof: { type: Boolean, default: false },
        panoramikTavan: { type: Boolean, default: false },
        cekiDemiri: { type: Boolean, default: false },
      },
      multimedya: {
        android: { type: Boolean, default: false },
        apple: { type: Boolean, default: false },
        bluetooth: { type: Boolean, default: false },
        usb: { type: Boolean, default: false },
      },
    },
    ekspertiz: {
      kaput: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      tavan: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      bagaj: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      sagOnKapi: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      sagArkaKapi: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      sagOnCamurluk: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      sagArkaCamurluk: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      solOnKapi: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      solArkaKapi: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      solOnCamurluk: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
      solArkaCamurluk: {
        type: String,
        enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
        default: "Orijinal",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    corporateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CorporateUser",
      default: null,
    },
    isCorporate: {
      type: Boolean,
      default: false,
    },
    isShowcased: {
      type: Boolean,
      default: false,
    },
    memberTeam: {
      type: String,
      default: false,
    },
    showcaseExpiresAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    expirationWarningSent: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },

    moderationStatus: {
      type: String,
      enum: [
        "approved", // Onaylı
        "revision_requested", // Düzeltme bekleniyor
        "rejected", // Yayınlanamaz
      ],
      default: "approved",
    },

    moderationNotes: {
      type: String,
      default: "",
    },

    moderatedAt: {
      type: Date,
      default: null,
    },

    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Admin modeli
      default: null,
    },
  },
  { timestamps: true },
);

carListingSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function (next) {
    try {
      const query = this.getQuery();
      const doc = await this.model.findOne(query);
      if (!doc) return next();

      const Showcase = require("../models/ShowcaseSchema");

      await Showcase.deleteMany({ listingId: doc._id });

      console.log("🗑️ Silinen ilana ait vitrin kaydı temizlendi:", doc._id);

      next();
    } catch (err) {
      next(err);
    }
  },
);

carListingSchema.pre("save", function (next) {
  // Yeni ilan oluşturuluyorsa
  if (this.isNew) {
    this.priceHistory.push({
      price: this.price,
      updatedAt: new Date(),
    });
  }

  next();
});

// carListingSchema.pre("findOneAndUpdate", async function (next) {
//   try {
//     const update = this.getUpdate();

//     console.log('update', update);

//     // price değişiyorsa
//     if (update.price) {
//       const currentListing = await this.model.findOne(this.getQuery());

//       if (
//         currentListing &&
//         String(currentListing.price) !== String(update.price)
//       ) {
//         update.$push = {
//           ...(update.$push || {}),
//           priceHistory: {
//             price: update.price,
//             updatedAt: new Date(),
//           },
//         };
//       }
//     }

//     next();
//   } catch (err) {
//     next(err);
//   }
// });

carListingSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();

    // Hem direkt price hem $set.price destekle
    const newPrice = update.price || update.$set?.price;

    if (newPrice) {
      const currentListing = await this.model.findOne(this.getQuery());

      if (currentListing && String(currentListing.price) !== String(newPrice)) {
        update.$push = {
          ...(update.$push || {}),
          priceHistory: {
            price: newPrice,
            updatedAt: new Date(),
          },
        };
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

carListingSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();

    const newPrice = update?.price || update?.$set?.price;

    if (!newPrice) {
      return next();
    }

    const currentListing = await this.model.findOne(this.getQuery());

    if (!currentListing) {
      return next();
    }

    // aynı fiyat ise çık
    if (String(currentListing.price) === String(newPrice)) {
      return next();
    }

    // fiyat geçmişi ekle
    if (!update.$push) {
      update.$push = {};
    }

    update.$push.priceHistory = {
      price: newPrice,
      updatedAt: new Date(),
    };

    // =========================
    // FAVORİ FİYAT DÜŞTÜ BİLDİRİMİ
    // =========================

    const oldPrice = Number(String(currentListing.price).replace(/\./g, ""));

    const updatedPrice = Number(String(newPrice).replace(/\./g, ""));

    // fiyat düştüyse
    // fiyat düştüyse
    if (updatedPrice < oldPrice) {
      // bireysel kullanıcılar
      // const normalUsers = await User.find({
      //   _id: { $ne: currentListing.user },
      //   favoriler: currentListing._id,
      // }).select("_id");

      // // kurumsal kullanıcılar
      // const corporateUsers = await CorporateUser.find({
      //   _id: { $ne: currentListing.corporateUser },
      //   favoriler: currentListing._id,
      // }).select("_id");

      const normalUsers = await User.find({
        _id: { $ne: currentListing.user },
        "favoriler.ilan": currentListing._id,
      }).select("_id");

      const corporateUsers = await CorporateUser.find({
        _id: { $ne: currentListing.corporateUser },
        "favoriler.ilan": currentListing._id,
      }).select("_id");

      // bireysel kullanıcı bildirimleri
      for (const user of normalUsers) {
        await sendNotification({
          userId: user._id,
          userModel: "User",
          title: "Favori İlanın Fiyatı Düştü",
          message: `${currentListing.ilanNo} numaralı favori ilanının fiyatı düştü.`,
          type: "favorite_price_drop",
          link: `/ilan/${currentListing.ilanNo}`,
          metadata: {
            oldPrice,
            newPrice: updatedPrice,
          },
        });
      }

      // kurumsal kullanıcı bildirimleri
      for (const user of corporateUsers) {
        await sendNotification({
          userId: user._id,
          userModel: "CorporateUser",
          title: "Favori İlanın Fiyatı Düştü",
          message: `${currentListing.ilanNo} numaralı favori ilanının fiyatı düştü.`,
          type: "favorite_price_drop",
          link: `/ilan/${currentListing.ilanNo}`,
          metadata: {
            oldPrice,
            newPrice: updatedPrice,
          },
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("CarListing", carListingSchema);
