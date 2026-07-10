const FeaturedGallery = require("../models/FeaturedGallery");
const CorporateUser = require("../models/CorporateUser");
const { deleteCacheByPattern } = require("../utils/cache");

exports.createFeaturedRequest = async (req, res) => {
  try {
    const corporateUserId = req.user.id;
    const { packageDays } = req.body;

    if (![7, 14, 30].includes(packageDays)) {
      return res.status(400).json({
        message: "Geçersiz paket seçimi.",
      });
    }

    const exists = await FeaturedGallery.findOne({
      corporateUser: corporateUserId,
      status: { $in: ["pending", "approved"] },
    });

    if (exists) {
      return res.status(400).json({
        message: "Aktif veya bekleyen bir talebiniz zaten var.",
      });
    }

    const request = await FeaturedGallery.create({
      corporateUser: corporateUserId,
      packageDays,
    });

    res.status(201).json({
      message: "Öne çıkarma talebi oluşturuldu.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Talep oluşturulamadı.",
    });
  }
};

exports.getAllFeaturedRequests = async (req, res) => {
  try {
    const requests = await FeaturedGallery.find({ status: "pending" })
      .populate("corporateUser", "galeriAdi email telefon sehir ilce logoUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Featured list error:", error);
    res.status(500).json({
      message: "Öne çıkarma talepleri alınamadı.",
    });
  }
};

exports.updateFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const featured = await FeaturedGallery.findById(id);

    if (!featured) {
      return res.status(404).json({
        message: "Talep bulunamadı.",
      });
    }

    featured.status = status;
    featured.adminNote = adminNote || "";

    if (status === "approved") {
      const startDate = new Date();
      const endDate = new Date();

      endDate.setDate(endDate.getDate() + featured.packageDays);

      featured.startDate = startDate;
      featured.endDate = endDate;
    }

    if (status === "rejected") {
      featured.startDate = null;
      featured.endDate = null;
    }

    await featured.save();
    await deleteCacheByPattern("cache:/galleryFeatured*");

    res.status(200).json({
      message: "Talep güncellendi.",
      featured,
    });
  } catch (error) {
    res.status(500).json({
      message: "Talep güncellenemedi.",
    });
  }
};

exports.getActiveFeaturedGalleries = async (req, res) => {
  try {
    const now = new Date();

    const featured = await FeaturedGallery.find({
      status: "approved",
      // startDate: { $lte: now },
      // endDate: { $gte: now },
    })
      .populate({
        path: "corporateUser",
        select: `
          galeriAdi
          slug
          logoUrl
          coverPhotoUrl
          sehir
          ilce
        `,
      })
      .sort({ startDate: -1 });

    res.status(200).json({
      count: featured.length,
      galleries: featured.map((f) => f.corporateUser),
    });
  } catch (error) {
    console.error("Active featured error:", error);
    res.status(500).json({
      message: "Öne çıkan galeriler alınamadı.",
    });
  }
};

exports.checkFeaturedStatus = async (req, res) => {
  try {
    const corporateUserId = req.user.id;

    const featured = await FeaturedGallery.findOne({
      corporateUser: corporateUserId,
      status: { $in: ["pending", "approved", "rejected"] },
    });

    res.status(200).json({
      hasFeaturedRequest: !!featured,
    });
  } catch (error) {
    res.status(500).json({
      message: "Öne çıkarma durumu kontrol edilemedi.",
    });
  }
};
