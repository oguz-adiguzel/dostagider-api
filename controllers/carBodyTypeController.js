const CarBodyType = require("../models/CarBodyType");
const cloudinary = require("../config/cloudinary");

const { deleteCacheByPattern } = require("../utils/cache");

// Yeni body type ekle
const addBodyType = async (req, res) => {
  try {
    const { bodyType } = req.body;

    if (!bodyType) {
      return res.status(400).json({ message: "Kasa tipi adı zorunludur." });
    }

    // Aynı body type var mı?
    const exists = await CarBodyType.findOne({ bodyType: bodyType.trim() });
    if (exists) {
      return res.status(400).json({ message: "Bu kasa tipi zaten mevcut." });
    }

    // Görsel kontrolü
    if (!req.file) {
      return res.status(400).json({ message: "Görsel (ikon / resim) gereklidir." });
    }

    // Cloudinary'e yükle
    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "car-body-types",
    });

    const newBodyType = await CarBodyType.create({
      bodyType: bodyType.trim(),
      imageUrl: upload.secure_url,
      publicId: upload.public_id,
    });

    await deleteCacheByPattern("cache:/body-types*");

    return res.status(201).json({
      message: "Kasa tipi başarıyla eklendi.",
      data: newBodyType,
    });
  } catch (error) {
    console.error("Kasa tipi ekleme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Kasa tipini sil (ve görseli Cloudinary'den)
const deleteBodyType = async (req, res) => {
  try {
    const { id } = req.params;

    const bodyTypeDoc = await CarBodyType.findById(id);
    if (!bodyTypeDoc) {
      return res.status(404).json({ message: "Kasa tipi bulunamadı." });
    }

    // Cloudinary'den sil
    await cloudinary.uploader.destroy(bodyTypeDoc.publicId);

    // MongoDB'den sil
    await CarBodyType.findByIdAndDelete(id);

    await deleteCacheByPattern("cache:/body-types*");


    return res.status(200).json({
      message: "Kasa tipi ve görsel başarıyla silindi.",
    });
  } catch (error) {
    console.error("Kasa tipi silme hatası:", error);
    return res.status(500).json({ message: "Silme işlemi sırasında hata." });
  }
};

// Tüm kasa tiplerini getir
const listBodyTypes = async (req, res) => {
  try {
    const list = await CarBodyType.find().sort({ bodyType: 1 });
    return res.status(200).json({
      message: "Kasa tipleri getirildi.",
      data: list,
    });
  } catch (error) {
    console.error("Kasa tipi listeleme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

module.exports = { addBodyType, deleteBodyType, listBodyTypes };
