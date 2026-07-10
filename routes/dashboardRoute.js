const express = require("express");
const router = express.Router();
const { getDashboardOverview } = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware"); 

router.get("/overview", authMiddleware(), getDashboardOverview);

module.exports = router;