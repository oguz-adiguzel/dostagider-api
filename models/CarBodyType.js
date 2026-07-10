// models/CarBodyType.js
const mongoose = require("mongoose");

const carBodyTypeSchema = new mongoose.Schema(
  {
    bodyType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {  // Cloudinary public_id, silme için
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarBodyType", carBodyTypeSchema);
