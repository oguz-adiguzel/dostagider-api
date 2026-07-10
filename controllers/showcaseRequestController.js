const ShowcaseRequest = require("../models/ShowcaseRequest");
const Showcase = require("../models/ShowcaseSchema");
const CarListing = require("../models/CarListing");
const Log = require("../models/Log");
const User = require("../models/User");
const CorporateUser = require("../models/CorporateUser");
const logger = require("../utils/logger");

const { deleteCacheByPattern } = require("../utils/cache");
const { getCache, setCache } = require("../utils/cache");

const createShowcaseRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ilanNo, reason } = req.body;

    if (!ilanNo) {
      return res
        .status(400)
        .json({ success: false, message: "ilanNo zorunludur." });
    }

    // İlanı bul
    const listing = await CarListing.findOne({ ilanNo });
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "İlan bulunamadı." });
    }

    // İlan sahibi kontrolü
    const ownerId =
      listing.user?.toString() || listing.corporateUser?.toString();
    if (!ownerId || ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bu ilana vitrin talebi yapmaya yetkiniz yok.",
      });
    }

    // Zaten pending talep var mı?
    const existingPending = await ShowcaseRequest.findOne({
      listingId: listing._id,
      status: "pending",
    });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "Bu ilan için zaten bekleyen bir vitrin talebi mevcut.",
      });
    }

    // Yeni talep oluştur
    const reqDoc = await ShowcaseRequest.create({
      listingId: listing._id,
      requestedBy: userId,
      reason: reason || "",
    });

    // 📌 LOG OLUŞTUR
    await logger.info({
      type: "showcase.request.create",
      message: `Yeni vitrin talebi oluşturuldu: ${ilanNo}`,
      meta: {
        ilanNo: ilanNo,
        reason: reason || "",
      },
      req, // opsiyonel, request objesini gönderebilirsin
      userId: userId || null,
      listingId: listing._id,
    });

    return res.status(201).json({
      success: true,
      message: "Vitrin talebi oluşturuldu. Admin onayı bekleniyor.",
      request: reqDoc,
    });
  } catch (error) {
    console.error("createShowcaseRequest error:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

const approveShowcaseRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user.id; // token'dan gelen admin ID

    // Talep bulunur
    const request =
      await ShowcaseRequest.findById(requestId).populate("listingId");
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Talep bulunamadı." });
    }

    // Zaten işlem görmüş mü?
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Bu talep daha önce işlenmiş.",
      });
    }

    // İlan kontrolü
    if (!request.listingId) {
      return res.status(404).json({
        success: false,
        message: "Talep edilen ilan artık mevcut değil.",
      });
    }

    // 30 gün geçerlilik süresi hesapla
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // ▶ 1) Showcase kaydı oluştur
    const showcase = await Showcase.create({
      listingId: request.listingId._id,
      expiresAt,
      isActive: true,
    });

    // ▶ 2) İlanı vitrine çıkmış olarak işaretle
    await CarListing.findByIdAndUpdate(request.listingId._id, {
      isShowcased: true,
      showcaseExpiresAt: expiresAt,
    });

    // ▶ 3) Talep güncelle
    request.status = "approved";
    request.processedBy = adminId;
    request.processedAt = new Date();
    request.adminMessage = req.body.adminMessage || "";
    await request.save();

    // await deleteCacheByPattern("showcase:list:*");
    await deleteCacheByPattern("cache:/vitrin*");

    // await deleteCacheByPattern("cache:/vitrin/active*");

    return res.status(200).json({
      success: true,
      message: "Vitrin talebi onaylandı.",
      showcase,
    });
  } catch (error) {
    console.error("approveShowcaseRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const rejectShowcaseRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user.id;

    const request = await ShowcaseRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Talep bulunamadı." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Bu talep daha önce işlenmiş.",
      });
    }

    request.status = "rejected";
    request.processedBy = adminId;
    request.processedAt = new Date();
    request.adminMessage = req.body.adminMessage || "";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Vitrin talebi reddedildi.",
    });
  } catch (error) {
    console.error("rejectShowcaseRequest error:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

const getPendingShowcaseRequests = async (req, res) => {
  try {
    const requests = await ShowcaseRequest.find({ status: "pending" })
      //   .populate("userId", "email name surname galeriAdi") // kullanıcı bilgisi ister misin?
      .populate(
        "listingId",
        "ilanNo baslik gorseller sehir ilce price createdAt",
      ); // ilan bilgisi

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("getPendingShowcaseRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const getActiveShowcaseListings = async (req, res) => {
  try {
    const { eV, page = 1 } = req.query;

    const limit = 12;
    const currentPage = Math.max(1, parseInt(page) || 1);
    const skip = (currentPage - 1) * limit;

    const showcases = await Showcase.find({ isActive: true })
      .populate({
        path: "listingId",
        select:
          "ilanNo baslik gorseller price brand model variant1 variant2 variant3 sehir ilce aracYili km vites yakit isEV _id",
        match: eV === "true" ? { isEV: true } : {},
      })
      .sort({ createdAt: -1 });

    const filteredShowcases =
      eV === "true"
        ? showcases.filter((item) => item.listingId !== null)
        : showcases;

    const paginatedData = filteredShowcases.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      page: currentPage,
      total: filteredShowcases.length,
      totalPages: Math.ceil(filteredShowcases.length / limit),
      count: paginatedData.length,
      data: paginatedData,
    });
  } catch (error) {
    console.error("getActiveShowcaseListings error:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const getRandomShowcaseListings = async (req, res) => {
  try {
    const { eV } = req.query;

    // ✅ QUERY YOKSA → ESKİ SİSTEM
    if (eV !== "true") {
      const showcases = await Showcase.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 5 } },
      ]);

      const populatedShowcases = await Showcase.populate(showcases, {
        path: "listingId",
        select:
          "ilanNo baslik gorseller price brand model variant1 variant2 variant3 sehir ilce aracYili km vites yakit isEV _id",
      });

      return res.status(200).json({
        success: true,
        count: populatedShowcases.length,
        data: populatedShowcases,
      });
    }

    // ✅ eV=true GELİRSE
    const showcases = await Showcase.aggregate([
      { $match: { isActive: true } },

      {
        $lookup: {
          from: "carlistings", // Mongo collection adı (küçük harf + çoğul)
          localField: "listingId",
          foreignField: "_id",
          as: "listing",
        },
      },

      { $unwind: "$listing" },

      // 🔥 ÖNCE EV FİLTRE
      { $match: { "listing.isEV": true } },

      // 🔥 SONRA RANDOM
      { $sample: { size: 5 } },

      // Response formatını eski yapıya yaklaştır
      {
        $project: {
          isActive: 1,
          expiresAt: 1,
          createdAt: 1,
          listingId: "$listing",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: showcases.length,
      data: showcases,
    });
  } catch (error) {
    console.error("getRandomShowcaseListings error:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

module.exports = {
  createShowcaseRequest,
  approveShowcaseRequest,
  rejectShowcaseRequest,
  getPendingShowcaseRequests,
  getActiveShowcaseListings,
  getRandomShowcaseListings,
};
