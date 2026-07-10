const express = require("express");
const router = express.Router();

const {
  createElectricCarOption,
  getAllElectricCarOptions,
  createCategory,
  getAllCategories,
  getFilteredElectricOptions
} = require("../controllers/evCarOptionsController");

// CREATE + MERGE
router.post("/create", createElectricCarOption);

router.get("/all", getAllElectricCarOptions);

router.post("/category", createCategory);

router.get("/categories", getAllCategories);

router.get("/filter", getFilteredElectricOptions);

module.exports = router;
