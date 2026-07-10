const express = require("express");
const router = express.Router();

const {
  createVehicleStock,
  getMyVehicleStocks,
  addExpenseToVehicle,
  updateVehicleStatus,
  getVehicleDashboard,
  getVehicleStockDetail
} = require("../controllers/vehicleStockController");

// const { authMiddleware } = require("../middlewares/authMiddleware");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware(["kurumsal"]), createVehicleStock);
router.get("/", authMiddleware(["kurumsal"]), getMyVehicleStocks);
router.post("/:id/expense", authMiddleware(["kurumsal"]), addExpenseToVehicle);
router.patch("/:id/status", authMiddleware(["kurumsal"]), updateVehicleStatus);
router.get("/dashboard", authMiddleware(["kurumsal"]), getVehicleDashboard);
router.get("/:id", authMiddleware(["kurumsal"]), getVehicleStockDetail);

module.exports = router;