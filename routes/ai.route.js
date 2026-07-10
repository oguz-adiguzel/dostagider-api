const express = require("express");
const router = express.Router();

const { generateCarDescription } = require("../controllers/ai.controller");

// POST /api/ai/car-description
router.post("/car-description", generateCarDescription);

module.exports = router;