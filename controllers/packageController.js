const Package = require("../models/Package");

const createPackage = async (req, res) => {
  try {
    const { name, type, duration, price, currency, order, features } = req.body;

    // Basic validation
    if (!name || !type || !duration || !price) {
      return res.status(400).json({
        message: "name, type, duration ve price alanları zorunludur.",
      });
    }

    // Aynı isim + type var mı kontrol et
    const existingPackage = await Package.findOne({ name, type });

    if (existingPackage) {
      return res.status(400).json({
        message: "Bu paket zaten mevcut.",
      });
    }

    // Yeni paket oluştur
    const newPackage = await Package.create({
      name,
      type,
      duration,
      price,
      currency,
      order,
      features,
    });

    return res.status(201).json({
      success: true,
      message: "Paket başarıyla oluşturuldu.",
      data: newPackage,
    });
  } catch (error) {
    console.error("createPackage error:", error);
    return res.status(500).json({
      message: "Paket oluşturulurken hata oluştu.",
    });
  }
};

const getPackages = async (req, res) => {
  try {
    const { type } = req.query;

    // query ile filtreleme
    const filter = type ? { type } : {};

    const packages = await Package.find(filter).sort({
      order: 1,
      createdAt: -1,
    }); // order'a göre sıralama, eşitse yeni olan önce

    return res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("getPackages error:", error);
    return res.status(500).json({
      message: "Paketler alınırken hata oluştu.",
    });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { packageId } = req.params; // URL'den paket ID
    const { name, duration, price, currency, order, isActive } = req.body;

    // Paketi bul
    const pack = await Package.findById(packageId);
    if (!pack) {
      return res.status(404).json({ message: "Paket bulunamadı" });
    }

    // Sadece gönderilen alanları güncelle
    if (name !== undefined) pack.name = name;
    if (duration !== undefined) pack.duration = duration;
    if (price !== undefined) pack.price = price;
    if (currency !== undefined) pack.currency = currency;
    if (order !== undefined) pack.order = order;
    if (isActive !== undefined) pack.isActive = isActive;

    await pack.save();

    return res.status(200).json({
      success: true,
      message: "Paket güncellendi",
      package: pack,
    });
  } catch (error) {
    console.error("Paket güncelleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Paket güncellenirken hata oluştu",
      error: error.message,
    });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params; // url'den paket id alınır

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Paket ID gerekli." });
    }

    const deleted = await Package.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Paket bulunamadı." });
    }

    return res.status(200).json({
      success: true,
      message: "Paket başarıyla silindi.",
      deletedId: id,
    });
  } catch (error) {
    console.error("Paket silme hatası:", error);
    return res
      .status(500)
      .json({ success: false, message: "Paket silinirken hata oluştu." });
  }
};

module.exports = {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
};
