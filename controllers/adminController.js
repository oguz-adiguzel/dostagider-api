const CorporateUser = require("../models/CorporateUser");
const User = require("../models/User");
const CarListing = require("../models/CarListing");
const CarOption = require("../models/CarOption");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Log = require("../models/Log");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { redisClient } = require("../config/redis");


const approveCorporateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await CorporateUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    user.isVerifiedAdmin = true;
    await user.save();

    res.status(200).json({ message: "Kurumsal hesap onaylandı." });
  } catch (error) {
    console.error("Admin onay hatası:", error);
    res.status(500).json({ message: "Onay işlemi başarısız." });
  }
};

// Admin Register
const registerAdmin = async (req, res) => {
  try {
    const { email, sifre, isim, role } = req.body;

    // Zorunlu alanlar kontrolü
    if (!email || !sifre || !isim) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun." });
    }

    // Daha önce kayıtlı mı?
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(409)
        .json({ message: "Bu email adresi zaten kayıtlı." });
    }

    // Şifre hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    // Yeni admin oluştur
    const newAdmin = new Admin({
      email,
      sifre: hashedPassword,
      isim,
      role: role || "admin", // default admin, istenirse superadmin oluşturulabilir
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin başarıyla oluşturuldu.",
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        isim: newAdmin.isim,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Admin register hatası:", error);
    res.status(500).json({ message: "Admin oluşturulurken bir hata oluştu." });
  }
};

// Admin Giriş (Login)
const loginAdmin = async (req, res) => {
  try {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ message: "Email ve şifre zorunludur." });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    const isMatch = await bcrypt.compare(sifre, admin.sifre);
    if (!isMatch) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    // ✅ Token oluştur
    const accessToken = generateAccessToken(admin._id, admin.role);
    const refreshToken = generateRefreshToken(admin._id, admin.role);

    // ✅ Refresh token cookie olarak saklanır
     res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Yanıt dön
    res.status(200).json({
      message: "Giriş başarılı.",
      accessToken,
      adminId: admin._id,
      role: admin.role,
    });
  } catch (error) {
    console.error("Admin giriş hatası:", error);
    res.status(500).json({ message: "Giriş yapılamadı." });
  }
};

const getAdminInfo = async (req, res) => {
  try {
    const user = await Admin.findById(req.user.id).select("-sifre");
    // şifre alanını göndermemek için -sifre ile hariç tuttuk

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      message: "Kullanıcı bilgileri getirildi",
      user: user,
    });
  } catch (error) {
    console.error("Kullanıcı bilgisi çekme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Onay bekleyen kurumsal kullanıcıları listele
const getPendingCorporateUsers = async (req, res) => {
  try {
    const pendingUsers = await CorporateUser.find({ isVerifiedAdmin: false })
      .select(
        "galeriAdi email telefon yetkiliAdi yetkiliSoyadi vergiDairesi vergiNo sehir ilce mahalle hesapOlusturmaTarihi"
      )
      .sort({ createdAt: -1 }); // Yeni başvurular önce

    res.status(200).json({ users: pendingUsers });
  } catch (error) {
    console.error(
      "Kurumsal onay bekleyen kullanıcıları getirme hatası:",
      error
    );
    res.status(500).json({ message: "Kullanıcılar alınamadı." });
  }
};

const rejectCorporateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const corporateUser = await CorporateUser.findById(id);
    if (!corporateUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Eğer kullanıcıya ait ilanlar varsa onları da silelim (opsiyonel)
    if (corporateUser.ilanlar && corporateUser.ilanlar.length > 0) {
      await CarListing.deleteMany({ _id: { $in: corporateUser.ilanlar } });
    }

    // Kurumsal kullanıcıyı sil
    await CorporateUser.findByIdAndDelete(id);

    res.status(200).json({ message: "Kullanıcı reddedildi ve silindi" });
  } catch (error) {
    console.error("Reddetme hatası:", error);
    res.status(500).json({ message: "Bir hata oluştu" });
  }
};

const adminListingSearch = async (req, res) => {
  try {
    const { ilanNo } = req.query;

    if (!ilanNo || ilanNo.length < 2) {
      return res.status(400).json({ message: "En az 2 karakter gerekli." });
    }

    const results = await CarListing.find({
      ilanNo: { $regex: "^" + ilanNo }, // baştan eşleşme
    }).limit(20);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Arama hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      level,
      type,
      userId,
      listingId,
      from,
      to,
    } = req.query;
    const query = {};

    if (level) query.level = level;
    if (type) query.type = type;
    if (userId) query.userId = userId;
    if (listingId) query.listingId = listingId;
    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);

    const skip = (Number(page) - 1) * Number(limit);

    const [total, logs] = await Promise.all([
      Log.countDocuments(query),
      Log.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ]);

    res
      .status(200)
      .json({
        success: true,
        total,
        page: Number(page),
        limit: Number(limit),
        logs,
      });
  } catch (err) {
    console.error("Log listeleme hatası:", err);
    res.status(500).json({ message: "Log alınırken hata oluştu." });
  }
};

const deleteInfoLogs = async (req, res) => {
  try {
    const result = await Log.deleteMany({ level: "info" });

    return res.status(200).json({
      success: true,
      message: "Info seviyesindeki loglar silindi.",
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error("Info log silme hatası:", error);
    return res.status(500).json({
      message: "Loglar silinirken hata oluştu.",
    });
  }
};

const deleteLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Log ID gereklidir."
      });
    }

    const deletedLog = await Log.findByIdAndDelete(id);

    if (!deletedLog) {
      return res.status(404).json({
        message: "Log bulunamadı."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Log başarıyla silindi.",
      deletedLog
    });

  } catch (error) {
    console.error("Log silme hatası:", error);
    return res.status(500).json({
      message: "Log silinirken hata oluştu."
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Toplam bireysel kullanıcı sayısı
    const totalUsers = await User.countDocuments();

    // Toplam kurumsal kullanıcı sayısı
    const totalCorporateUsers = await CorporateUser.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCorporateUsers,
        totalAllUsers: totalUsers + totalCorporateUsers,
      },
    });
  } catch (error) {
    console.error("Dashboard stats hatası:", error);
    res.status(500).json({
      success: false,
      message: "Dashboard verileri alınamadı.",
    });
  }
};

const getTotalCarListings = async (req, res) => {
  try {
    const totalListings = await CarListing.countDocuments();
    const activeListings = await CarListing.countDocuments({ isActive: true });
    const passiveListings = await CarListing.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        totalListings,
        activeListings,
        passiveListings,
      },
    });
  } catch (error) {
    console.error("Toplam ilan sayısı hatası:", error);
    res.status(500).json({
      success: false,
      message: "Toplam ilan sayısı alınamadı.",
    });
  }
};

const getWeeklyCarListings = async (req, res) => {
  try {
    const now = new Date();

    // Haftanın başlangıcını bul (Pazartesi)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // Pazar=0, Pazartesi=1 ...
    const diff = day === 0 ? 6 : day - 1; // Pazartesi başlangıcı
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Haftanın başlangıcından şimdiye kadar eklenen ilanları say
    const weeklyListings = await CarListing.countDocuments({
      createdAt: { $gte: startOfWeek },
    });

    res.status(200).json({
      success: true,
      data: {
        weeklyListings,
        startOfWeek,
        today: now,
      },
    });
  } catch (error) {
    console.error("Haftalık ilan sayısı hatası:", error);
    res.status(500).json({
      success: false,
      message: "Haftalık ilan sayısı alınamadı.",
    });
  }
};

const getLast30DaysListingTrend = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 29); 
    last30Days.setHours(0, 0, 0, 0);

    // MongoDB aggregation ile günlük ilan sayıları
    const trendData = await CarListing.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    // Tüm 30 gün için boş günleri de tamamlama
    const result = [];
    const dateCursor = new Date(last30Days);

    while (dateCursor <= today) {
      const formatted = `${dateCursor.getFullYear()}-${String(
        dateCursor.getMonth() + 1
      ).padStart(2, "0")}-${String(dateCursor.getDate()).padStart(2, "0")}`;

      const found = trendData.find(
        (item) =>
          item._id.year === dateCursor.getFullYear() &&
          item._id.month === dateCursor.getMonth() + 1 &&
          item._id.day === dateCursor.getDate()
      );

      result.push({
        date: formatted,
        count: found ? found.count : 0,
      });

      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Trend verisi hatası:", error);
    res.status(500).json({
      success: false,
      message: "Trend verisi alınamadı.",
    });
  }
};

const getWeeklyUserFlow = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    // Hem bireysel hem kurumsal kullanıcıları tek seferde toplamak için pipeline oluşturuyoruz
    const pipeline = (Model) => [
      { $match: { createdAt: { $gte: last7Days, $lte: today } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ];

    const [userData, corporateData] = await Promise.all([
      User.aggregate(pipeline(User)),
      CorporateUser.aggregate(pipeline(CorporateUser)),
    ]);

    // Tek birleştirilmiş liste oluştur
    const combined = [...userData, ...corporateData];

    const result = [];
    const cursor = new Date(last7Days);

    while (cursor <= today) {
      const formattedDate = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;

      const dayCount = combined
        .filter(
          (item) =>
            item._id.year === cursor.getFullYear() &&
            item._id.month === cursor.getMonth() + 1 &&
            item._id.day === cursor.getDate()
        )
        .reduce((sum, item) => sum + item.count, 0);

      result.push({
        date: formattedDate,
        count: dayCount,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Haftalık kullanıcı akış hatası:", error);
    res.status(500).json({
      success: false,
      message: "Haftalık kullanıcı akışı getirilemedi.",
    });
  }
};


const getTotalCorporateListings = async (req, res) => {
 try {
    // Kurumsal kullanıcı ID'lerini al
    const corporateUsers = await CorporateUser.find({}, "_id");
    const corporateUserIds = corporateUsers.map(u => u._id);

    // Kurumsal ilan sayısı
    const totalCorporateListings = await CarListing.countDocuments({
      user: { $in: corporateUserIds },
    });

    // Bireysel kullanıcı ID'lerini al
    const individualUsers = await User.find({}, "_id");
    const individualUserIds = individualUsers.map(u => u._id);

    // Bireysel ilan sayısı
    const totalIndividualListings = await CarListing.countDocuments({
      user: { $in: individualUserIds },
    });

    res.status(200).json({
      success: true,
      data: {
        totalCorporateListings,
        totalIndividualListings,
      },
    });
  } catch (error) {
    console.error("İlan sayısı hatası:", error);
    res.status(500).json({
      success: false,
      message: "İlan sayısı alınamadı.",
    });
  }
};

const getTotalBrands = async (req, res) => {
   try {
    const carOptions = await CarOption.find(); // Tüm kategorileri çek
    let totalBrands = 0;

    carOptions.forEach(option => {
      if (option.brands && option.brands.length > 0) {
        totalBrands += option.brands.length;
      }
    });

    res.status(200).json({
      success: true,
      totalBrands
    });
  } catch (error) {
    console.error("Brand sayısı alınamadı:", error);
    res.status(500).json({
      success: false,
      message: "Brand sayısı alınamadı.",
      error: error.message
    });
  }
};

const getCorporateList = async (req, res) => {
  try {
    const users = await CorporateUser.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Corporate users list error:", error);
    res.status(500).json({
      message: "Kurumsal kullanıcılar getirilirken hata oluştu",
    });
  }
}

const getCacheKeys = async (req, res) => {
  try {
    const keys = await redisClient.keys("cache:*");

    return res.json({
      success: true,
      count: keys.length,
      data: keys,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


module.exports = {
  approveCorporateUser,
  registerAdmin,
  loginAdmin,
  getAdminInfo,
  getPendingCorporateUsers,
  rejectCorporateUser,
  adminListingSearch,
  getLogs,
  getDashboardStats,
  getTotalCarListings,
  getWeeklyCarListings,
  getLast30DaysListingTrend,
  getWeeklyUserFlow,
  getTotalCorporateListings,
  getTotalBrands,
  getCorporateList,
  deleteInfoLogs,
  deleteLogById,
  getCacheKeys
};
