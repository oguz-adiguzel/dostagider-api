const ListingReport = require("../models/ListingReport");
const CarListing = require("../models/CarListing");
const sendNotification = require("../utils/sendNotification");

const createListingReport = async (req, res) => {
  try {
    const { listingId, reason, message } = req.body;

    if (!listingId || !reason) {
      return res.status(400).json({
        message: "İlan ve şikayet nedeni zorunludur.",
      });
    }

    // ilan var mı
    const listing = await CarListing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "İlan bulunamadı.",
      });
    }

    const userModel = req.user.role === "kurumsal" ? "CorporateUser" : "User";

    // daha önce şikayet etmiş mi
    const existingReport = await ListingReport.findOne({
      listing: listingId,
      user: req.user.id,
    });

    if (existingReport) {
      return res.status(400).json({
        message: "Bu ilanı daha önce şikayet ettiniz.",
      });
    }

    const report = await ListingReport.create({
      listing: listingId,
      user: req.user.id,
      userModel,
      reason,
      message,
    });

    res.status(201).json({
      message: "Şikayetiniz başarıyla gönderildi.",
      report,
    });
  } catch (error) {
    console.log("Şikayet oluşturma hatası:", error);

    res.status(500).json({
      message: "Şikayet oluşturulurken hata oluştu.",
    });
  }
};

const getListingReports = async (req, res) => {
  try {
    const reports = await ListingReport.find()
      .populate({
        path: "listing",
        select: "ilanNo baslik category brand model",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.log("Şikayetler getirilirken hata:", error);

    res.status(500).json({
      message: "Şikayetler getirilirken hata oluştu.",
    });
  }
};

const reviewListingReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await ListingReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        message: "Şikayet kaydı bulunamadı.",
      });
    }

    await ListingReport.findByIdAndDelete(reportId);

    await sendNotification({
      userId: report.user,
      userModel: report.userModel,
      title: "Şikayetiniz İncelendi",
      message: `İnceleme sonucunda ilanda kusur bulunmamıştır.`,
      type: "admin",
      link: ``,
    });

    res.status(200).json({
      message: "Şikayet incelendi ve kaldırıldı.",
    });
  } catch (error) {
    console.log("Şikayet inceleme hatası:", error);

    res.status(500).json({
      message: "Şikayet incelenirken hata oluştu.",
    });
  }
};



const warnListingOwner = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        message: "Uyarı notu zorunludur.",
      });
    }

    const report = await ListingReport.findById(reportId)
      .populate("listing");

    if (!report) {
      return res.status(404).json({
        message: "Şikayet bulunamadı.",
      });
    }

    const listing = await CarListing.findById(report.listing._id);

    if (!listing) {
      return res.status(404).json({
        message: "İlan bulunamadı.",
      });
    }

    listing.moderationStatus = "revision_requested";
    listing.moderationNotes = note;
    listing.moderatedAt = new Date();
    listing.moderatedBy = req.user.id;

    await listing.save();

    const userModel = listing.isCorporate
      ? "CorporateUser"
      : "User";

    await sendNotification({
      userId: listing.user,
      userModel,
      title: "İlanınız İçin Düzeltme Talebi",
      message: `${listing.ilanNo} numaralı ilanınız için düzeltme talep edildi.`,
      type: "admin",
      link: `/user/ilanlarim`,
    });

    res.status(200).json({
      message: "İlan sahibi uyarıldı.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "İşlem sırasında hata oluştu.",
    });
  }
};

module.exports = {
  createListingReport,
  getListingReports,
  reviewListingReport,
  warnListingOwner
};
