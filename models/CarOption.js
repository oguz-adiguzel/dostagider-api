const mongoose = require("mongoose");

const variant3Schema = new mongoose.Schema({
  variant3: String
}, { _id: false });

const variant2Schema = new mongoose.Schema({
  variant2: String,
  children: [variant3Schema]
}, { _id: false });

const variant1Schema = new mongoose.Schema({
  variant1: String,
  children: [variant2Schema]
}, { _id: false });

const modelSchema = new mongoose.Schema({
  name: String,
  variants: [variant1Schema]
}, { _id: false });

const brandSchema = new mongoose.Schema({
  brand: String,
  models: [modelSchema]
}, { _id: false });

const carOptionSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  brands: [brandSchema]
});

module.exports = mongoose.models.CarOption || mongoose.model("CarOption", carOptionSchema);
