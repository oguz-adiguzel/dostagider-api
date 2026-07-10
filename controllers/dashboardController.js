const User = require("../models/User");
const CorporateUser = require("../models/CorporateUser");
const CarListing = require("../models/CarListing");

const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id; // JWT middleware’den geliyor
    const role = req.user.role; // bireysel / kurumsal

    let user;
    let maxLimit = 1; // default bireysel
    let favorites = [];
    let listings = [];

    if (role === "bireysel") {
      user = await User.findById(userId)
        .populate("ilanlar")
        .populate("favoriler");

      listings = user.ilanlar;
      favorites = user.favoriler;
      maxLimit = 1;
    } else if (role === "kurumsal") {
      user = await CorporateUser.findById(userId).populate("ilanlar");

      listings = user.ilanlar;
      favorites = []; // kurumsalda favori yok
      maxLimit = 20;
    }

    // İlan istatistikleri
    const activeListings = listings.filter(
      (item) => item.isActive === true,
    ).length;
    const inactiveListings = listings.filter(
      (item) => item.isActive === false,
    ).length;

    // Limit durumu
    const limitFull = activeListings >= maxLimit;

    const totalViews = listings.reduce((sum, item) => {
      return sum + (item.views || 0);
    }, 0);

    return res.json({
      success: true,
      data: {
        userInfo: {
          role,
          isim: user?.isim || user?.galeriAdi,
          logo: user?.logoUrl || null,
        },
        statistics: {
          totalActive: activeListings,
          totalInactive: inactiveListings,
          favorites: favorites.length || 0,
          messages: 0, // mesaj sistemin yoksa şimdilik 0
          totalViews,
        },
        limits: {
          maxLimit,
          activeCount: activeListings,
          limitFull,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard hata:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

module.exports = {
  getDashboardOverview,
};
