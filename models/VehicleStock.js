const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ekspertiz", "noter", "bakim", "tamir", "sigorta", "diger"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["stokta", "ilanda", "rezerve", "satildi"],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const vehicleStockSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      default: null,
    },

    ilanNo: {
      type: String,
      default: null
    },

    plate: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    package: {
      type: String,
      default: "",
    },

    year: {
      type: Number,
    },

    km: {
      type: Number,
    },

    fuelType: {
      type: String,
    },

    transmission: {
      type: String,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    targetSalePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    listingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    expenses: [expenseSchema],

    purchaseDate: {
      type: Date,
      required: true,
    },

    listingDate: {
      type: Date,
      default: null,
    },

    soldDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["stokta", "ilanda", "rezerve", "satildi"],
      default: "stokta",
    },

    statusHistory: [statusHistorySchema],

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ✅ INDEXLER
vehicleStockSchema.index({ owner: 1, plate: 1 }, { unique: true });
vehicleStockSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model("VehicleStock", vehicleStockSchema);
