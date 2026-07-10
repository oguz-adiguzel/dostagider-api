const mongoose = require("mongoose");

const ekipSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true, trim: true },
    soyad: { type: String, required: true, trim: true },
    gorev: { type: String, required: true, trim: true },
    telefon: { type: String, required: true, trim: true },
    fotoUrl: { type: String, default: null }, // Cloudinary URL
    publicId: { type: String, default: null }, // Cloudinary dosya yönetimi için
  },
  { timestamps: true },
);

const corporateUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sifre: {
      type: String,
      required: true,
    },
    galeriAdi: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true, // her galeri için benzersiz olmasını sağlar
      trim: true,
    },
    logoUrl: {
      type: String, // Cloudinary URL
      default: null,
    },
    coverPhotoUrl: {
      type: String, // Galeri sayfasının üst kısmında kullanılacak görsel
      default: null,
    },
    hakkimizda: {
      type: String, // Galeri hakkında tanıtım metni
      default: "",
      trim: true,
    },
    telefon: {
      type: String,
      required: true,
    },
    yetkiliAdi: {
      type: String,
      required: true,
    },
    yetkiliSoyadi: {
      type: String,
      required: true,
    },
    vergiDairesi: {
      type: String,
      required: true,
    },
    vergiNo: {
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
    acikAdres: {
      type: String,
      default: "",
    },
    hesapOlusturmaTarihi: {
      ay: {
        type: Number,
        required: true,
      },
      yil: {
        type: Number,
        required: true,
      },
    },
    ilanlar: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarListing",
      },
    ],
    role: {
      type: String,
      enum: ["bireysel", "kurumsal", "admin"],
      required: true,
      default: "kurumsal",
    },
    isVerified: {
      type: Boolean,
      default: false, // Mail doğrulaması
    },
    isPayment: {
      type: Boolean,
      default: false, // Ödeme doğrulaması
    },
    verificationCode: {
      type: String,
      default: null,
    },
    favoriler: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarListing",
      },
    ],
    calismaSaatleri: {
      haftaIci: { type: String, default: "" },
      haftaSonu: { type: String, default: "" },
    },
    isVerifiedAdmin: {
      type: Boolean,
      default: false, // Admin tarafından manuel onay
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },

    ekip: [ekipSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("CorporateUser", corporateUserSchema);
