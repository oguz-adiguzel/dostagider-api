const CarBrand = require("../models/CarBrand");
const cloudinary = require("cloudinary").v2;
const { deleteCacheByPattern } = require("../utils/cache");

const addBrand = async (req, res) => {
  try {
    const { brandName } = req.body;

    if (!brandName) {
      return res.status(400).json({ message: "brandName zorunludur." });
    }

    // Aynı marka var mı?
    const exists = await CarBrand.findOne({ brandName: brandName.trim() });
    if (exists) {
      return res.status(400).json({ message: "Bu marka zaten mevcut." });
    }

    // Logo zorunlu
    if (!req.file) {
      return res.status(400).json({ message: "Logo görseli gereklidir." });
    }

    // Cloudinary’e yükleme
    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "car-brands",
    });

    // Kaydet
    const newBrand = await CarBrand.create({
      brandName: brandName.trim(),
      logoUrl: upload.secure_url,
    });

    await deleteCacheByPattern("cache:/car-brands*");

    return res.status(201).json({
      message: "Marka başarıyla eklendi.",
      data: newBrand,
    });
  } catch (error) {
    console.error("Marka ekleme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const getCarBrands = async (req, res) => {
  try {
    const brands = await CarBrand.find().sort({ brandName: 1 }); // A-Z sıralı

    return res.status(200).json({
      message: "Marka listesi getirildi.",
      data: brands,
    });
  } catch (error) {
    console.error("Marka listesi getirme hatası:", error);
    return res.status(500).json({
      message: "Marka listesi getirilirken bir hata oluştu.",
      error,
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await CarBrand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı." });
    }

    // Eğer logo Cloudinary'de kayıtlıysa sil
    if (brand.logoUrl) {
      try {
        await cloudinary.uploader.destroy(brand.logoUrl);
      } catch (err) {
        console.error("Cloudinary silme hatası:", err);
      }
    }

    await CarBrand.findByIdAndDelete(id);
    await deleteCacheByPattern("cache:/car-brands*");

    return res.status(200).json({
      message: "Marka ve logo başarıyla silindi.",
    });
  } catch (error) {
    console.error("Marka silme hatası:", error);
    return res.status(500).json({
      message: "Marka silinirken bir hata oluştu.",
      error,
    });
  }
};

module.exports = { addBrand, getCarBrands, deleteBrand };
