const mongoose = require("mongoose");
const { USER_ROLES } = require("../utils/constant");

const userSchema = new mongoose.Schema(
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
    isim: {
      type: String,
      required: true,
    },
    soyisim: {
      type: String,
      required: true,
    },
    sehir: {
      type: String,
    },
    ilce: {
      type: String,
    },
    mahalle: {
      type: String,
    },
    telefon: {
      type: String,
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
    // favoriler: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "CarListing",
    //   },
    // ],

    favoriler: [
  {
    ilan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // mail doğrulaması yapılmamış
    },
    verificationCode: {
      type: String,
      default: null, // mail ile gönderilecek kod
    },
    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
