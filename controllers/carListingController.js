const CarListing = require("../models/CarListing");
const CorporateUser = require("../models/CorporateUser");
const ViewTrack = require("../models/viewTrackModel");
const cloudinary = require("../config/cloudinary");
const getPublicIdFromUrl = require("../utils/getPublicIdFromUrl");
const User = require("../models/User");
const logger = require("../utils/logger");
const sharp = require("sharp");
const fs = require("fs");
const sendNotification = require("../utils/sendNotification");

const generateNumericListingNumber = () => {
  const min = 100000000;
  const max = 999999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const safeParse = (val) => {
  if (!val) return undefined;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
};

const createCarListing = async (req, res) => {
  try {
    const userId = req.user.id;

    // ---------------------------------------------------
    // İlan Limiti Kontrolü
    // ---------------------------------------------------

    // Kullanıcı tipini bul
    const corporateUser = await CorporateUser.findById(userId);

    const isCorporate = !!corporateUser;

    const maxNormalListings = isCorporate ? 20 : 1;
    const maxEVListings = isCorporate ? 10 : 3;

    // Normal ilanlar (isEV false veya yok)
    const normalListingsCount = await CarListing.countDocuments({
      user: userId,
      isActive: true,
      $or: [{ isEV: { $exists: false } }, { isEV: false }],
    });

    // Elektrikli ilanlar
    const evListingsCount = await CarListing.countDocuments({
      user: userId,
      isActive: true,
      isEV: true,
    });

    const isEVRequest = req.body.isEV === true || req.body.isEV === "true";

    if (isEVRequest) {
      // EV ilan limiti kontrolü
      if (evListingsCount >= maxEVListings) {
        return res.status(403).json({
          message: isCorporate
            ? "Kurumsal kullanıcılar en fazla 10 elektrikli ilan yayınlayabilir."
            : "Bireysel kullanıcılar en fazla 3 elektrikli ilan yayınlayabilir.",
        });
      }
    } else {
      // 🚗 Normal ilan limiti kontrolü
      if (normalListingsCount >= maxNormalListings) {
        return res.status(403).json({
          message: isCorporate
            ? "Kurumsal kullanıcılar en fazla 20 aktif ilana sahip olabilir."
            : "Bireysel kullanıcılar en fazla 1 aktif ilana sahip olabilir.",
        });
      }
    }

    let ilanNo;
    let isUnique = false;

    const teknikOzelliklerParsed = safeParse(req.body.teknikOzellikler) || {};
    const ekspertizParsed = safeParse(req.body.ekspertiz) || {};

    // Benzersiz ilan numarası üret
    while (!isUnique) {
      ilanNo = generateNumericListingNumber().toString();
      const existing = await CarListing.findOne({ ilanNo });
      if (!existing) isUnique = true;
    }

    // ---------------------------------------------------
    // Cloudinary Public ID Çıkarma (HATA YOK!)
    // ---------------------------------------------------
    function extractPublicIdFromUrl(imageUrl) {
      try {
        const url = new URL(imageUrl);
        // pathname örn: /dat9ypehi/image/upload/v1762264806/kurumsal_logo/ntubgvzutvsznbvsb5ws.jpg
        const afterUpload = url.pathname.split("/upload/")[1]; // "v1762264806/kurumsal_logo/ntubgvzutvsznbvsb5ws.jpg"
        if (!afterUpload) return null;

        // versiyon kısmını (v12345/) kaldır
        const withoutVersion = afterUpload.replace(/^v\d+\//, ""); // "kurumsal_logo/ntubgvzutvsznbvsb5ws.jpg"

        // uzantıyı kaldır
        const withoutExt = withoutVersion.substring(
          0,
          withoutVersion.lastIndexOf("."),
        ); // "kurumsal_logo/ntubgvzutvsznbvsb5ws"

        // folder:name formatı
        const folderName = withoutExt.replace("/", ":"); // "kurumsal_logo:ntubgvzutvsznbvsb5ws"

        return folderName;
      } catch (err) {
        return null;
      }
    }

    // ---------------------------------------------------
    // Kurumsal kullanıcı logosu (VARSA)
    // ---------------------------------------------------
    // const corporateUser = await CorporateUser.findById(userId);
    const corporateLogoPublicIdRaw = corporateUser?.logoUrl
      ? extractPublicIdFromUrl(corporateUser.logoUrl)
      : null;

    // ---------------------------------------------------
    // Cloudinary Görsel Yükleme + Filigranlar
    // ---------------------------------------------------

    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // 1️⃣ Sharp ile optimize edilmiş temp dosya oluştur
          const optimizedPath = file.path + "-optimized.webp";

          await sharp(file.path)
            .resize({
              width: 1600, // büyük fotoğrafları küçültüyoruz
              withoutEnlargement: true,
            })
            .webp({ quality: 70 }) // kalite azalt → 12MB → 600KB
            .toFile(optimizedPath);

          // Optimize edilmiş dosyayı Cloudinary'e yükle
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
              optimizedPath,
              {
                folder: "ilan_gorselleri",
                resource_type: "image",

                transformation: [
                  // Ek sıkıştırma
                  { fetch_format: "webp" },
                  { quality: "auto:eco" },

                  // Site logosu (sağ alt)
                  {
                    overlay: "watermarks:site-logo",
                    gravity: "south_east",
                    opacity: 20,
                    width: "0.50",
                    flags: "relative",
                    x: 0,
                    y: 0,
                  },

                  // Kurumsal logo (sol alt)
                  ...(corporateLogoPublicIdRaw
                    ? [
                        {
                          overlay: corporateLogoPublicIdRaw,
                          gravity: "south_west",
                          opacity: 50,
                          width: "0.10",
                          flags: "relative",
                          x: 10,
                          y: 10,
                        },
                      ]
                    : []),
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              },
            );
          });

          uploadedImages.push(result.secure_url);

          setTimeout(() => {
            fs.rm(file.path, { force: true }, () => {});
            fs.rm(optimizedPath, { force: true }, () => {});
          }, 30);
          // Temp dosyaları sil
          // fs.unlinkSync(file.path);
          // fs.unlinkSync(optimizedPath);
        } catch (err) {
          console.error("Görsel optimize + upload hatası:", err);
        }
      }
    }

    // ---------------------------------------------------
    // Body'den gelen alanlar
    // ---------------------------------------------------
    const {
      category,
      baslik,
      price,
      brand,
      model,
      variant1,
      variant2,
      variant3,
      aracYili,
      yakit,
      vites,
      km,
      kasaTipi,
      garanti,
      agirHasarKaydi,
      takas,
      aciklama,
      sehir,
      ilce,
      mahalle,
      teknikOzellikler,
      ekspertiz,
      noExpertiz,
      memberTeam,
      isEV,
    } = req.body;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Yeni ilan oluştur
    const newListing = new CarListing({
      ilanNo,
      baslik,
      price,
      category,
      brand,
      model,
      sehir,
      ilce,
      mahalle,
      variant1,
      variant2,
      variant3,
      aracYili,
      yakit: isEV ? "Elektrik" : yakit,
      vites,
      km,
      kasaTipi,
      garanti,
      agirHasarKaydi,
      takas,
      aciklama,
      noExpertiz,
      teknikOzellikler: { ...teknikOzelliklerParsed },
      ekspertiz: { ...ekspertizParsed },
      gorseller: uploadedImages,
      expiresAt,
      isActive: true,
      user: userId,
      memberTeam,
      isEV,
      isCorporate,
    });

    await newListing.save();

    // Kullanıcıya ilanı ekle
    const user =
      (await User.findById(userId)) || (await CorporateUser.findById(userId));

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    await user.updateOne({
      $push: { ilanlar: newListing._id },
    });

    // Log kaydı
    await logger.info({
      type: "ilan.create",
      message: `Yeni ilan oluşturuldu: ${newListing.ilanNo}`,
      meta: {
        baslik: newListing.baslik,
        price: newListing.price,
        brand: newListing.brand,
      },
      req,
      userId,
      listingId: newListing._id,
    });

    await sendNotification({
      userId: userId,
      userModel: user.role === "kurumsal" ? "CorporateUser" : "User",
      title: "İlan yayınlandı",
      message: `${newListing.ilanNo} ilan numarası ile yayınlanmıştır.`,
      type: "listing",
      link: `https://dostagider-ui.vercel.app//ilan/${newListing.ilanNo}`,
    });

    res.status(201).json({
      message: "İlan başarıyla oluşturuldu.",
      ilan: newListing,
    });
  } catch (error) {
    console.error("İlan oluşturulurken hata:", error);
    res.status(500).json({ message: "İlan oluşturulurken bir hata oluştu." });
  }
};

const getAllCarListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // sabit değer
    const skip = (page - 1) * limit;

    const total = await CarListing.countDocuments();
    const listings = await CarListing.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalListings: total,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("İlanlar listelenirken hata:", error);
    res.status(500).json({ message: "İlanlar alınırken bir hata oluştu." });
  }
};

const filterCarListings = async (req, res) => {
  try {
    const {
      category,
      brand,
      model,
      variant1,
      variant2,
      variant3,
      aracYiliMin,
      aracYiliMax,
      kmMin,
      kmMax,
      yakit,
      vites,
      kasaTipi,
      sehir,
      ilce,
      mahalle,
      fiyatMin,
      fiyatMax,
      vitrin,
      page = 1, // default olarak 1. sayfa
    } = req.query;

    const { sort = "advanced" } = req.query;

    const limit = 12;
    const skip = (parseInt(page) - 1) * limit;

    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (variant1) filter.variant1 = variant1;
    if (variant2) filter.variant2 = variant2;
    if (variant3) filter.variant3 = variant3;
    if (yakit) filter.yakit = yakit;
    if (vites) filter.vites = vites;
    if (kasaTipi) filter.kasaTipi = kasaTipi;
    // if (sehir) filter.sehir = sehir;
    // if (ilce) filter.ilce = ilce;

    // Şehir / İlçe filtreleme
    if (sehir) {
      const selectedCities = Array.isArray(sehir) ? sehir : [sehir];

      const districtFilters = ilce ? (Array.isArray(ilce) ? ilce : [ilce]) : [];

      const groupedDistricts = {};

      districtFilters.forEach((item) => {
        const [city, district] = item.split(":");

        if (!groupedDistricts[city]) {
          groupedDistricts[city] = [];
        }

        groupedDistricts[city].push(district);
      });

      const orConditions = [];

      // İlçesi seçilmiş şehirler
      Object.entries(groupedDistricts).forEach(([city, districts]) => {
        orConditions.push({
          sehir: city,
          ilce: { $in: districts },
        });
      });

      // İlçesi seçilmemiş şehirler
      selectedCities
        .filter((city) => !groupedDistricts[city])
        .forEach((city) => {
          orConditions.push({
            sehir: city,
          });
        });

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
    }

    if (mahalle) filter.mahalle = mahalle;
    if (vitrin) filter.isShowcased = vitrin;

    filter.isActive = true;

    if (aracYiliMin || aracYiliMax) {
      filter.aracYili = {};
      if (aracYiliMin) filter.aracYili.$gte = parseInt(aracYiliMin);
      if (aracYiliMax) filter.aracYili.$lte = parseInt(aracYiliMax);
    }

    if (fiyatMin || fiyatMax) {
      filter.price = {};
      if (fiyatMin) filter.price.$gte = parseInt(fiyatMin);
      if (fiyatMax) filter.price.$lte = parseInt(fiyatMax);
    }

    if (kmMin || kmMax) {
      filter.km = {};
      if (kmMin) filter.km.$gte = parseInt(kmMin);
      if (kmMax) filter.km.$lte = parseInt(kmMax);
    }

    let sortQuery = {};
    switch (sort) {
      case "price_asc":
        sortQuery = { price: 1 };
        break;

      case "price_desc":
        sortQuery = { price: -1 };
        break;

      case "date_desc":
        sortQuery = { createdAt: -1 };
        break;

      case "km_asc":
        sortQuery = { km: 1 };
        break;

      case "km_desc":
        sortQuery = { km: -1 };
        break;

      case "model_asc":
        sortQuery = { aracYili: 1 };
        break;

      case "model_desc":
        sortQuery = { aracYili: -1 };
        break;

      case "advanced":
      default:
        sortQuery = {
          isPremium: -1, // varsa (öne çıkarılan)
          isBoosted: -1, // varsa
          updatedAt: -1, // güncel ilan
          createdAt: -1, // yeni ilan
        };
        break;
    }

    const total = await CarListing.countDocuments(filter);

    const listings = await CarListing.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalListings: total,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Filtreleme sırasında hata:", error);
    res.status(500).json({ message: "Filtreleme sırasında bir hata oluştu." });
  }
};

const searchCarListings = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Arama ifadesi (q) gereklidir.",
      });
    }

    const regex = new RegExp(q, "i");

    // İlan No Araması
    const listings = await CarListing.find({
      ilanNo: regex,
    })
      .select("ilanNo baslik price gorseller brand model category variant1")
      .limit(10);

    // Galeri Adı Araması
    const galleries = await CorporateUser.find({
      galeriAdi: regex,
    })
      .select("galeriAdi logoUrl slug")
      .limit(10);

    const searchData = [
      ...listings.map((listing) => ({
        type: "listing",
        ilanNo: listing.ilanNo,
        baslik: listing.baslik,
        price: listing.price,
        image: listing.gorseller?.[0] || null,
        brand: listing.brand,
        model: listing.model,
        category: listing.category,
        variant1: listing.variant1,
      })),

      ...galleries.map((gallery) => ({
        type: "gallery",
        galeriAdi: gallery.galeriAdi,
        logoUrl: gallery.logoUrl,
        slug: gallery.slug,
      })),
    ];

    res.status(200).json({
      count: searchData.length,
      searchData,
    });
  } catch (error) {
    console.error("Arama sırasında hata:", error);

    res.status(500).json({
      message: "Arama sırasında bir hata oluştu.",
    });
  }
};

const getCarListingByIlanNo = async (req, res) => {
  try {
    const { ilanNo } = req.query;

    if (!ilanNo) {
      return res.status(400).json({
        message: "İlan numarası (ilanNo) gereklidir.",
      });
    }

    const clientIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip;

    // -----------------------
    // 1) İlanı çek (lean + populate YOK)
    // -----------------------
    const listing = await CarListing.findOne({ ilanNo }).lean();

    if (!listing) {
      return res.status(404).json({
        message: "Bu ilan numarasına ait ilan bulunamadı.",
      });
    }

    // -----------------------
    // 2) User'ı PARALEL çek
    // -----------------------
    const [user, corporateUser] = await Promise.all([
      User.findById(listing.user)
        .select(
          "isim soyisim telefon email hesapOlusturmaTarihi role sehir ilce mahalle userType",
        )
        .lean(),

      CorporateUser.findById(listing.user)
        .select(
          "galeriAdi slug sehir ilce mahalle hesapOlusturmaTarihi role yetkiliAdi yetkiliSoyadi telefon ekip",
        )
        .lean(),
    ]);

    const finalUser = user || corporateUser;

    // -----------------------
    // 3) Response HEMEN dön
    // -----------------------
    res.status(200).json({
      ilan: {
        ...listing,
        user: finalUser,
        userType: finalUser?.userType || (user ? "individual" : "corporate"),
      },
    });

    // -----------------------
    // 4) View tracking async
    // -----------------------
    setImmediate(async () => {
      try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const existingView = await ViewTrack.findOne({
          listingId: listing._id,
          ip: clientIP,
          viewedAt: { $gte: last24Hours },
        }).lean();

        if (!existingView) {
          await ViewTrack.create({
            listingId: listing._id,
            ip: clientIP,
          });

          await CarListing.updateOne(
            { _id: listing._id },
            { $inc: { views: 1 } },
          );
        }
      } catch (err) {
        console.error("View tracking error:", err);
      }
    });
  } catch (error) {
    console.error("İlan detay getirirken hata:", error);

    res.status(500).json({
      message: "İlan detay bilgisi alınırken bir hata oluştu.",
      error: error,
    });
  }
};

const updateCarListing = async (req, res) => {
  try {
    const { ilanNo } = req.body;

    if (!ilanNo) {
      return res.status(400).json({
        message: "İlan numarası (ilanNo) zorunludur.",
      });
    }

    // Güncellenmesine izin verilen alanlar
    const allowedFields = ["baslik", "price", "km", "aciklama", "memberTeam"];

    const updateData = {};

    // Sadece gönderilen alanları update objesine ekle
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Güncellenecek hiçbir alan yoksa
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Güncellenecek herhangi bir alan gönderilmedi.",
      });
    }

    const ilan = await CarListing.findOneAndUpdate(
      { ilanNo },
      { $set: updateData },
      { new: true }, // güncellenmiş halini döner
    );

    if (!ilan) {
      return res.status(404).json({
        message: "İlan bulunamadı.",
      });
    }

    res.status(200).json({
      message: "İlan başarıyla güncellendi.",
      ilan,
    });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({
      message: "İlan güncellenirken bir hata oluştu.",
    });
  }
};

const updateCarListingImage = async (req, res) => {
  try {
    const { ilanNo, eskiGorselUrl } = req.body;

    if (!ilanNo || !eskiGorselUrl) {
      return res
        .status(400)
        .json({ message: "İlan no ve eski görsel URL zorunludur." });
    }

    const ilan = await CarListing.findOne({ ilanNo });
    if (!ilan) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    // Görsel URL listesinde bu görsel var mı?
    const index = ilan.gorseller.indexOf(eskiGorselUrl);
    if (index === -1) {
      return res
        .status(404)
        .json({ message: "Belirtilen görsel bu ilana ait değil." });
    }

    // Eski görseli Cloudinary'den sil
    const publicId = getPublicIdFromUrl(eskiGorselUrl);
    await cloudinary.uploader.destroy(publicId);

    // Yeni görseli yükle
    const yeniDosya = req.file;
    if (!yeniDosya) {
      return res
        .status(400)
        .json({ message: "Yeni görsel dosyası yüklenmeli." });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        yeniDosya.path,
        { folder: "ilan_gorselleri", resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
    });

    // Yeni URL ile eski URL'yi değiştir
    ilan.gorseller[index] = result.secure_url;
    await ilan.save();

    res.status(200).json({
      message: "Görsel başarıyla güncellendi.",
      gorseller: ilan.gorseller,
    });
  } catch (error) {
    console.error("Görsel güncelleme hatası:", error);
    res.status(500).json({ message: "Görsel güncellenemedi." });
  }
};

const addImagesToCarListing = async (req, res) => {
  try {
    const { ilanNo } = req.body;

    if (!ilanNo) {
      return res.status(400).json({ message: "İlan numarası zorunludur." });
    }

    const ilan = await CarListing.findOne({ ilanNo });
    if (!ilan) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Yüklenecek görsel bulunamadı." });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file.path,
          { folder: "ilan_gorselleri", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        );
      });

      uploadedImages.push(result);
    }

    // Yeni görselleri eski listeye ekle
    ilan.gorseller.push(...uploadedImages);
    await ilan.save();

    res.status(200).json({
      message: "Yeni görseller başarıyla eklendi.",
      gorseller: ilan.gorseller,
    });
  } catch (error) {
    console.error("Yeni görsel ekleme hatası:", error);
    res.status(500).json({ message: "Görseller eklenirken hata oluştu." });
  }
};

const reorderCarListingImages = async (req, res) => {
  try {
    const { ilanNo, yeniSiralama } = req.body;

    if (!ilanNo || !Array.isArray(yeniSiralama)) {
      return res
        .status(400)
        .json({ message: "ilanNo ve yeniSiralama zorunludur." });
    }

    const ilan = await CarListing.findOne({ ilanNo });
    if (!ilan) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    // Eski görsellerin birebir sırasını yeni gelenle eşleştir
    const mevcutGorseller = ilan.gorseller;

    const siralanmis = yeniSiralama.filter((url) =>
      mevcutGorseller.includes(url),
    );

    // Yeni sıralama ile ilanı güncelle
    ilan.gorseller = siralanmis;
    await ilan.save();

    res.status(200).json({
      message: "Görsel sıralaması başarıyla güncellendi.",
      gorseller: ilan.gorseller,
    });
  } catch (error) {
    console.error("Sıralama hatası:", error);
    res.status(500).json({ message: "Görsel sıralaması güncellenemedi." });
  }
};

const deleteCarListingImage = async (req, res) => {
  try {
    const { ilanNo, gorselUrl } = req.body;

    if (!ilanNo || !gorselUrl) {
      return res
        .status(400)
        .json({ message: "ilanNo ve gorselUrl zorunludur." });
    }

    const ilan = await CarListing.findOne({ ilanNo });
    if (!ilan) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    // Görsel bu ilana ait mi?
    const index = ilan.gorseller.indexOf(gorselUrl);
    if (index === -1) {
      return res.status(404).json({ message: "Görsel bu ilana ait değil." });
    }

    // Cloudinary'den sil
    const publicId = getPublicIdFromUrl(gorselUrl);
    await cloudinary.uploader.destroy(publicId);

    // MongoDB'den çıkar
    ilan.gorseller.splice(index, 1);
    await ilan.save();

    res.status(200).json({
      message: "Görsel başarıyla silindi.",
      gorseller: ilan.gorseller,
    });
  } catch (error) {
    console.error("Görsel silme hatası:", error);
    res.status(500).json({ message: "Görsel silinirken bir hata oluştu." });
  }
};

const deleteCarListingByIlanNo = async (req, res) => {
  try {
    const { ilanNo } = req.query;

    if (!ilanNo) {
      return res.status(400).json({ message: "ilanNo zorunludur." });
    }

    const ilan = await CarListing.findOne({ ilanNo });

    if (!ilan) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    // ✅ Sadece ilan sahibi silebilir
    if (
      ilan.user &&
      ilan.user.toString() !== req.user.id &&
      ilan.corporateUser &&
      ilan.corporateUser.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Bu ilanı silme yetkiniz yok!" });
    }

    // ✅ Cloudinary görsellerini sil
    if (ilan.gorseller && ilan.gorseller.length > 0) {
      for (const url of ilan.gorseller) {
        const publicId = getPublicIdFromUrl(url);
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // ✅ User / CorporateUser modelinde ilan ID kaldır
    if (ilan.user) {
      await User.findByIdAndUpdate(ilan.user, {
        $pull: { ilanlar: ilan._id },
      });
    } else if (ilan.corporateUser) {
      await CorporateUser.findByIdAndUpdate(ilan.corporateUser, {
        $pull: { ilanlar: ilan._id },
      });
    }

    // ✅ MongoDB'den ilanı sil
    await CarListing.deleteOne({ ilanNo });

    res.status(200).json({
      message: "İlan başarıyla silindi ve kullanıcı ilişiği kaldırıldı.",
    });
  } catch (error) {
    console.error("İlan silme hatası:", error);
    res.status(500).json({ message: "İlan silinirken bir hata oluştu." });
  }
};

const getUserListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; // Kullanıcı tipini token'dan alıyoruz

    let filter = {};

    if (role === "corporate") {
      filter.corporateUser = userId;
    } else {
      filter.user = userId;
    }

    const listings = await CarListing.find(filter)
      .populate("user", "isim soyisim email")
      .populate("corporateUser", "galeriAdi email yetkiliAdSoyad"); // kurumsal için populate

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("getUserListings error:", error);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    let user = await User.findById(userId).populate({
      path: "favoriler.ilan",
      populate: {
        path: "user",
        select: "isim soyisim email",
      },
    });

    if (!user) {
      user = await CorporateUser.findById(userId).populate({
        path: "favoriler.ilan",
        populate: {
          path: "user",
          select: "isim soyisim email",
        },
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.favoriler.length,
      favoriler: user.favoriler,
    });
  } catch (error) {
    console.error("getUserFavorites error:", error);

    return res.status(500).json({
      message: "Sunucu hatası",
    });
  }
};

const renewListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { days } = req.body; // kullanıcıdan gelen süre (ör. 7 gün)

    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        message: "En az 1 gün seçmelisiniz.",
      });
    }

    // İlanı bul
    const listing = await CarListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "İlan bulunamadı.",
      });
    }

    // Yeni expire tarihi hesapla
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Güncelle
    listing.isActive = true;
    listing.expiresAt = expiresAt;

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "İlan başarıyla yeniden yayına alındı.",
      expiresAt,
    });
  } catch (err) {
    console.error("renewListing error:", err);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const estimateCarValue = async (req, res) => {
  try {
    const {
      category,
      brand,
      model,
      variant1,
      variant2,
      variant3,
      aracYili,
      km,
    } = req.query;

    if (!category || !brand || !model || !aracYili || !km) {
      return res.status(400).json({
        message: "category, brand, model, aracYili ve km zorunludur.",
      });
    }

    const kmValue = parseInt(km);
    const yearValue = parseInt(aracYili);

    // KM +/- 10.000
    const kmMin = kmValue - 10000;
    const kmMax = kmValue + 10000;

    const filter = {
      category,
      brand,
      model,
      aracYili: yearValue,
      km: { $gte: kmMin, $lte: kmMax },
    };

    // Variantlar opsiyonel
    if (variant1) filter.variant1 = variant1;
    if (variant2) filter.variant2 = variant2;
    if (variant3) filter.variant3 = variant3;

    const results = await CarListing.aggregate([
      { $match: filter },
      {
        $addFields: {
          priceNum: { $toDouble: "$price" },
        },
      },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$priceNum" },
          minPrice: { $min: "$priceNum" },
          maxPrice: { $max: "$priceNum" },
          totalListings: { $sum: 1 },
        },
      },
    ]);

    if (results.length === 0) {
      return res.status(404).json({
        message: "Bu özelliklerde bir ilan bulunamadı.",
        kmRange: { kmMin, kmMax },
      });
    }

    const data = results[0];

    res.status(200).json({
      kmRange: { kmMin, kmMax },
      totalListings: data.totalListings,
      averagePrice: Math.round(data.avgPrice),
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
    });
  } catch (error) {
    console.error("Araç değerleme hatası:", error);
    res
      .status(500)
      .json({ message: "Araç değerlemesi sırasında hata oluştu." });
  }
};

const getCarListingForUpdate = async (req, res) => {
  try {
    const { ilanNo } = req.params;

    if (!ilanNo) {
      return res.status(400).json({
        message: "İlan numarası (ilanNo) zorunludur.",
      });
    }

    const ilan = await CarListing.findOne(
      { ilanNo },
      {
        ilanNo: 1,
        baslik: 1,
        price: 1,
        km: 1,
        aciklama: 1,
        memberTeam: 1,
        gorseller: 1,
      },
    );

    if (!ilan) {
      return res.status(404).json({
        message: "İlan bulunamadı.",
      });
    }

    res.status(200).json({
      ilan,
    });
  } catch (error) {
    console.error("İlan getirme hatası:", error);
    res.status(500).json({
      message: "İlan bilgileri alınırken bir hata oluştu.",
    });
  }
};

const getLatestCarListings = async (req, res) => {
  try {
    const listings = await CarListing.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("getLatestCarListings error:", error);
    return res.status(500).json({
      success: false,
      message: "İlanlar alınırken bir hata oluştu.",
    });
  }
};

module.exports = {
  createCarListing,
  getAllCarListings,
  filterCarListings,
  searchCarListings,
  getCarListingByIlanNo,
  updateCarListing,
  updateCarListingImage,
  addImagesToCarListing,
  reorderCarListingImages,
  deleteCarListingImage,
  deleteCarListingByIlanNo,
  getUserListings,
  getUserFavorites,
  renewListing,
  estimateCarValue,
  getCarListingForUpdate,
  getLatestCarListings,
};
