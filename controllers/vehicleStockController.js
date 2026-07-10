const VehicleStock = require("../models/VehicleStock");

const createVehicleStock = async (req, res) => {
  try {
    const owner = req.user.id;

    const { plate, brand, model, purchasePrice, purchaseDate } = req.body;

    if (!plate || !brand || !model || !purchasePrice || !purchaseDate) {
      return res.status(400).json({
        success: false,
        message: "Zorunlu alanlar eksik",
      });
    }

    const vehicle = await VehicleStock.create({
      ...req.body,
      owner,
      statusHistory: [{ status: "stokta" }],
    });

    res.status(201).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyVehicleStocks = async (req, res) => {
  try {
    const owner = req.user.id;

    const vehicles = await VehicleStock.find({ owner })
      .sort({ createdAt: -1 })
      .lean();

    const vehiclesWithStats = vehicles.map((v) => {
      const totalExpenses = v.expenses.reduce(
        (acc, item) => acc + item.amount,
        0,
      );

      const totalCost = v.purchasePrice + totalExpenses;

      const profit = v.soldPrice - totalCost;

      return {
        ...v,
        totalExpenses,
        totalCost,
        profit,
      };
    });

    res.status(200).json({
      success: true,
      count: vehiclesWithStats.length,
      vehicles: vehiclesWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addExpenseToVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { type, amount, note } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: "type ve amount zorunlu",
      });
    }

    const vehicle = await VehicleStock.findOne({
      _id: vehicleId,
      owner: req.user.id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Araç bulunamadı",
      });
    }

    vehicle.expenses.push({
      type,
      amount,
      note,
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Masraf eklendi",
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { status, soldPrice, listingId, ilanNo } = req.body;

    const validStatuses = ["stokta", "ilanda", "rezerve", "satildi"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz status",
      });
    }

    // 1. VEHICLE ÖNCE ÇEKİLİR (KRİTİK DÜZELTME)
    const vehicle = await VehicleStock.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("listingId");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Araç bulunamadı",
      });
    }

    // 2. SATILMIŞ KONTROLÜ
    if (vehicle.status === "satildi") {
      return res.status(400).json({
        success: false,
        message: "Araç zaten satılmış",
      });
    }

    // 3. SATILDI VALIDATION
    if (status === "satildi" && !soldPrice) {
      return res.status(400).json({
        success: false,
        message: "Satış fiyatı zorunludur",
      });
    }

    // 4. İLAN VALIDATION (vehicle artık var!)
    if (status === "ilanda" && !listingId && !vehicle.listingId) {
      return res.status(400).json({
        success: false,
        message: "İlan seçimi zorunludur",
      });
    }

    // 5. STATUS UPDATE
    vehicle.status = status;

    // 6. HISTORY
    vehicle.statusHistory.push({
      status,
      date: new Date(),
    });

    // 7. İLAN BAĞLAMA
    if (status === "ilanda") {
      vehicle.listingId = listingId || vehicle.listingId;
      vehicle.ilanNo = ilanNo 
      vehicle.listingDate = vehicle.listingDate || new Date();
    }

    // 8. SATILDI FİYAT
    if (status === "satildi") {
      vehicle.soldDate = new Date();
      vehicle.soldPrice = soldPrice;
    }

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Status güncellendi",
      vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getVehicleDashboard = async (req, res) => {
  try {
    const owner = req.user.id;

    const vehicles = await VehicleStock.find({ owner }).lean();

    const totalVehicles = vehicles.length;
    const inStock = vehicles.filter((v) => v.status === "stokta").length;
    const soldVehicles = vehicles.filter((v) => v.status === "satildi").length;

    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalExpenses = 0;

    const lossVehicles = [];
    const alerts = [];
    const criticalVehicles = [];

    const expenseBreakdown = {
      ekspertiz: 0,
      noter: 0,
      bakim: 0,
      tamir: 0,
      sigorta: 0,
      diger: 0,
    };

    const statusDistribution = {
      stokta: 0,
      ilanda: 0,
      rezerve: 0,
      satildi: 0,
    };

    const monthlyProfitMap = {};
    const vehicleProfits = [];

    // TEK LOOP (EN KRİTİK DÜZELTME)
    vehicles.forEach((v) => {
      statusDistribution[v.status]++;

      const expenseTotal = v.expenses.reduce((acc, e) => {
        expenseBreakdown[e.type] =
          (expenseBreakdown[e.type] || 0) + e.amount;
        return acc + e.amount;
      }, 0);

      totalExpenses += expenseTotal;

      const totalCost = v.purchasePrice + expenseTotal;
      totalInvestment += totalCost;

      const days =
        (new Date() - new Date(v.purchaseDate)) / (1000 * 60 * 60 * 24);

      // SATILMIŞ ARAÇ
      if (v.status === "satildi") {
        const soldPrice = v.soldPrice || 0;
        const profit = soldPrice - totalCost;

        totalRevenue += soldPrice;
        totalProfit += profit;

        const roi =
          totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) : 0;

        vehicleProfits.push({
          _id: v._id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          purchasePrice: v.purchasePrice,
          soldPrice,
          totalCost,
          profit,
          roi,
        });

        // zarar listesi
        if (profit < 0) {
          lossVehicles.push({
            _id: v._id,
            plate: v.plate,
            brand: v.brand,
            model: v.model,
            loss: profit,
            totalCost,
            soldPrice,
          });

          alerts.push({
            type: "LOSS",
            severity: "high",
            message: `${v.plate} zararına satıldı (${profit} ₺)`,
          });
        }

        // aylık kar
        const month = new Date(v.soldDate).toLocaleString("default", {
          month: "short",
        });

        monthlyProfitMap[month] =
          (monthlyProfitMap[month] || 0) + profit;
      }

      // SATILMAMIŞ ARAÇ ANALİZİ
      if (v.status !== "satildi") {
        let riskLevel = "low";
        let suggestion = null;

        if (days > 60) {
          riskLevel = "high";
          suggestion = "Fiyat düşürmeyi düşün";
        } else if (days > 30) {
          riskLevel = "medium";
          suggestion = "İlanı güncelle / öne çıkar";
        }

        if (riskLevel !== "low") {
          criticalVehicles.push({
            _id: v._id,
            plate: v.plate,
            brand: v.brand,
            model: v.model,
            daysInStock: Math.floor(days),
            riskLevel,
            suggestion,
          });

          alerts.push({
            type: "LONG_STOCK",
            severity: riskLevel === "high" ? "high" : "medium",
            vehicleId: v._id, 
            message: `${v.plate} ${Math.floor(
              days
            )} gündür stokta`,
          });
        }
      }

      // YÜKSEK MASRAF ALERT
      if (expenseTotal > v.purchasePrice * 0.25) {
        alerts.push({
          type: "HIGH_EXPENSE",
          severity: "medium",
          vehicleId: v._id, 
          message: `${v.plate} masrafları yüksek`,
        });
      }

      // İLANSIZ ARAÇ
      if (v.status === "stokta" && !v.listingId) {
        alerts.push({
          type: "NO_LISTING",
          severity: "low",
          vehicleId: v._id,
          message: `${v.plate} henüz ilana konulmamış`,
        });
      }
    });

    const topProfitableVehicles = vehicleProfits
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const monthlyProfit = Object.entries(monthlyProfitMap).map(
      ([month, profit]) => ({
        month,
        profit,
      })
    );

    const soldWithDates = vehicles.filter(
      (v) =>
        v.status === "satildi" &&
        v.purchaseDate &&
        v.soldDate
    );

    let avgDays = 0;

    if (soldWithDates.length) {
      const totalDays = soldWithDates.reduce((acc, v) => {
        const diff =
          (new Date(v.soldDate) - new Date(v.purchaseDate)) /
          (1000 * 60 * 60 * 24);

        return acc + diff;
      }, 0);

      avgDays = Math.round(totalDays / soldWithDates.length);
    }

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        inStock,
        soldVehicles,
        totalInvestment,
        totalRevenue,
        totalProfit,
        totalExpenses,
        averageSellDurationDays: avgDays,

        expenseBreakdown,
        statusDistribution,
        monthlyProfit,

        topProfitableVehicles,
        lossVehicles,
        alerts,
        criticalVehicles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getVehicleStockDetail = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const owner = req.user.id;

    const vehicle = await VehicleStock.findOne({
      _id: vehicleId,
      owner,
    }).populate("listingId"); //

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Araç bulunamadı",
      });
    }

    const totalExpenses = vehicle.expenses.reduce(
      (acc, e) => acc + e.amount,
      0,
    );

    const totalCost = vehicle.purchasePrice + totalExpenses;

    const profit = vehicle.soldPrice > 0 ? vehicle.soldPrice - totalCost : null;

    const daysInStock =
      vehicle.status !== "satildi"
        ? Math.ceil(
            (new Date() - new Date(vehicle.purchaseDate)) /
              (1000 * 60 * 60 * 24),
          )
        : Math.ceil(
            (new Date(vehicle.soldDate) - new Date(vehicle.purchaseDate)) /
              (1000 * 60 * 60 * 24),
          );

    res.status(200).json({
      success: true,
      vehicle: {
        ...vehicle.toObject(),

        stats: {
          totalExpenses,
          totalCost,
          profit,
          daysInStock,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createVehicleStock,
  getMyVehicleStocks,
  addExpenseToVehicle,
  updateVehicleStatus,
  getVehicleDashboard,
  getVehicleStockDetail,
};
