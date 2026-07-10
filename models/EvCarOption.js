const mongoose = require("mongoose");

const technicalSchema = new mongoose.Schema({
  range: Number,
  batteryCapacity: Number,
  avgConsumption: Number,
  motorPower: Number
}, { _id: false });

const evVariantSchema = new mongoose.Schema({
  variant1: String,
  technical: technicalSchema   // 👈 variant1 teknik alanı
}, { _id: false });

const evModelSchema = new mongoose.Schema({
  name: String,
  technical: technicalSchema,  // 👈 model teknik alanı
  variants: [evVariantSchema]
}, { _id: false });

const evBrandSchema = new mongoose.Schema({
  brand: String,
  models: [evModelSchema]
}, { _id: false });

const electricCarSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  brands: [evBrandSchema]
});

module.exports =
  mongoose.models.ElectricCarOption ||
  mongoose.model("ElectricCarOption", electricCarSchema);
