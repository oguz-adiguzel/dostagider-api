const BrandPriceList = require("../models/BrandPriceList");
const cloudinary = require("../config/cloudinary");
const logger = require("../utils/logger");

const createBrandPriceList = async (req, res) => {
  try {
    const { brand, slug, sourceUrl } = req.body;

    if (!brand || !slug || !sourceUrl) {
      return res.status(400).json({
        message: "Marka adı, slug ve kaynak URL zorunludur.",
      });
    }

    const exists = await BrandPriceList.findOne({
      $or: [{ brand: brand.trim() }, { slug: slug.trim() }],
    });

    if (exists) {
      return res.status(400).json({
        message: "Bu marka zaten mevcut.",
      });
    }

    // Logo kontrolü
    if (!req.file) {
      return res.status(400).json({
        message: "Marka logosu zorunludur.",
      });
    }

    // Cloudinary upload
    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "brand-logos",
    });

    const brandPriceList = await BrandPriceList.create({
      brand: brand.trim(),
      slug: slug.trim(),
      logoUrl: upload.secure_url,
      logoPublicId: upload.public_id,
      sourceUrl: sourceUrl.trim(),
      models: [],
    });

    await logger.info({
      type: "brand.price.list.success",
      message: `Yeni Sıfır Araç Markası Eklendi: ${brand}`,
      meta: {
        brand: brand,
        slug: slug,
        sourceUrl: sourceUrl,
        // logoUrl: logoUrl,
      },
      // req,
      brand: brand,
    });

    return res.status(201).json({
      message: "Marka fiyat listesi başarıyla oluşturuldu.",
      data: brandPriceList,
    });
  } catch (error) {
    console.error("Marka oluşturma hatası:", error);
    await logger.error({
      type: "brand.price.list.error",
      message: `Marka eklenirken hata oluştu`,
      meta: { error: error.message },
      req,
    });
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const addModelToBrand = async (req, res) => {
  try {
    const { brandSlug } = req.params;
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        message: "Model adı ve slug zorunludur.",
      });
    }

    const brand = await BrandPriceList.findOne({ slug: brandSlug });
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı." });
    }

    const modelExists = brand.models.some(
      (model) => model.slug === slug.trim()
    );

    if (modelExists) {
      return res.status(400).json({
        message: "Bu model zaten ekli.",
      });
    }

    // Görsel kontrolü
    if (!req.file) {
      return res.status(400).json({
        message: "Model görseli zorunludur.",
      });
    }

    // Cloudinary upload
    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "car-models",
    });

    brand.models.push({
      name: name.trim(),
      slug: slug.trim(),
      photoUrl: upload.secure_url,
      photoPublicId: upload.public_id,
      packages: [],
    });

    await logger.info({
      type: "brand.price.list.success",
      message: `Yeni Sıfır Araç Modeli Eklendi: ${name}`,
      meta: {
        name: name,
        slug: slug,
        // sourceUrl: sourceUrl,
        // logoUrl: logoUrl,
      },
      // req,
      name: name,
    });

    await brand.save();

    return res.status(201).json({
      message: "Model başarıyla eklendi.",
      data: brand,
    });
  } catch (error) {
    console.error("Model ekleme hatası:", error);
     await logger.error({
      type: "brand.price.list.error",
      message: `Model eklenirken hata oluştu`,
      meta: { error: error.message },
      req,
    });
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const addPackageToModel = async (req, res) => {
  try {
    const { brandSlug, modelSlug } = req.params;
    const { name, fuelType, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Paket adı ve fiyat zorunludur.",
      });
    }

    if (isNaN(price)) {
      return res.status(400).json({
        message: "Fiyat sayısal olmalıdır.",
      });
    }

    const brand = await BrandPriceList.findOne({ slug: brandSlug });
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı." });
    }

    const model = brand.models.find((m) => m.slug === modelSlug);

    if (!model) {
      return res.status(404).json({ message: "Model bulunamadı." });
    }

    const packageExists = model.packages.some(
      (pkg) => pkg.name === name.trim()
    );

    if (packageExists) {
      return res.status(400).json({
        message: "Bu paket zaten ekli.",
      });
    }

    model.packages.push({
      name: name.trim(),
      fuelType: fuelType?.trim(),
      price: Number(price),
      lastUpdatedAt: new Date(),
      isActive: true,
    });

    await brand.save();

    return res.status(201).json({
      message: "Paket (fiyat) başarıyla eklendi.",
      data: brand,
    });
  } catch (error) {
    console.error("Paket ekleme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const updatePackagePrice = async (req, res) => {
  try {
    const { brandSlug, modelSlug, packageName } = req.params;
    const { price, fuelType, isActive } = req.body;

    if (price !== undefined && isNaN(price)) {
      return res.status(400).json({
        message: "Fiyat sayısal olmalıdır.",
      });
    }

    const brand = await BrandPriceList.findOne({ slug: brandSlug });
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı." });
    }

    const model = brand.models.find((m) => m.slug === modelSlug);
    if (!model) {
      return res.status(404).json({ message: "Model bulunamadı." });
    }

    const pkg = model.packages.find((p) => p.name === packageName);
    if (!pkg) {
      return res.status(404).json({ message: "Paket bulunamadı." });
    }

    // Alanları güncelle
    if (price !== undefined) pkg.price = Number(price);
    if (fuelType !== undefined) pkg.fuelType = fuelType.trim();
    if (isActive !== undefined) pkg.isActive = isActive;

    pkg.lastUpdatedAt = new Date();

    await brand.save();

    return res.status(200).json({
      message: "Paket fiyatı başarıyla güncellendi.",
      data: brand,
    });
  } catch (error) {
    console.error("Paket güncelleme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { brandSlug, modelSlug } = req.params;
    const { name } = req.body; // package name

    if (!name) {
      return res.status(400).json({
        message: "Paket adı zorunludur.",
      });
    }

    const brand = await BrandPriceList.findOne({ slug: brandSlug });
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı." });
    }

    const model = brand.models.find((m) => m.slug === modelSlug);
    if (!model) {
      return res.status(404).json({ message: "Model bulunamadı." });
    }

    const pkg = model.packages.find((p) => p.name === name);
    if (!pkg) {
      return res.status(404).json({ message: "Paket bulunamadı." });
    }

    // Soft delete
    pkg.isActive = false;
    pkg.lastUpdatedAt = new Date();

    await brand.save();

    return res.status(200).json({
      message: "Paket başarıyla pasife alındı.",
      data: brand,
    });
  } catch (error) {
    console.error("Paket silme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const getAllBrandPriceLists = async (req, res) => {
  try {
    const brands = await BrandPriceList.find().sort({ brand: 1 });

    return res.status(200).json({
      data: brands,
    });
  } catch (error) {
    console.error("Marka listesi getirme hatası:", error);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

const markBrandChecked = async (req, res) => {
  const { brandSlug } = req.params;

  const brand = await BrandPriceList.findOne({ slug: brandSlug });
  if (!brand) {
    return res.status(404).json({ message: "Marka bulunamadı" });
  }

  brand.hasPossibleUpdate = false;
  brand.lastCheckedAt = new Date();
  brand.sourceChangedAt = null;
  await brand.save();

  res.json({ message: "Marka kontrol edildi olarak işaretlendi." });
};

const deleteBrandModel = async (req, res) => {
  try {
    const { brandId, modelName } = req.params;

    // Marka bulunuyor
    const brand = await BrandPriceList.findById(brandId);

    if (!brand) {
      return res.status(404).json({
        message: "Marka bulunamadı.",
      });
    }

    // Model bulunuyor
    const model = brand.models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase()
    );

    if (!model) {
      return res.status(404).json({
        message: "Model bulunamadı.",
      });
    }

    // Cloudinary görsel silme
    if (model.photoPublicId) {
      await cloudinary.uploader.destroy(model.photoPublicId);
    }

    // Array içerisinden modeli kaldır
    brand.models = brand.models.filter(
      (m) => m.name.toLowerCase() !== modelName.toLowerCase()
    );

    await brand.save();

    await logger.info({
      type: "brand.model.delete.success",
      message: "Marka modeli silindi",
      meta: {
        brandId,
        modelName,
      },
      req,
    });

    return res.status(200).json({
      message: "Model başarıyla silindi.",
    });
  } catch (error) {
    console.error("Model silme hatası:", error);

    await logger.error({
      type: "brand.model.delete.error",
      message: "Model silinirken hata oluştu",
      meta: {
        error: error.message,
      },
      req,
    });

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
};


const deleteModelPackage = async (req, res) => {
  try {
    const { brandId, modelName, packageName } = req.params;

    // Marka bulunuyor
    const brand = await BrandPriceList.findById(brandId);

    if (!brand) {
      return res.status(404).json({
        message: "Marka bulunamadı.",
      });
    }

    // Model bulunuyor
    const model = brand.models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase()
    );

    if (!model) {
      return res.status(404).json({
        message: "Model bulunamadı.",
      });
    }

    // Paket bulunuyor
    const selectedPackage = model.packages.find(
      (p) => p.name.toLowerCase() === packageName.toLowerCase()
    );

    if (!selectedPackage) {
      return res.status(404).json({
        message: "Paket bulunamadı.",
      });
    }

    // Paketi array içerisinden kaldır
    model.packages = model.packages.filter(
      (p) => p.name.toLowerCase() !== packageName.toLowerCase()
    );

    await brand.save();

    await logger.info({
      type: "brand.package.delete.success",
      message: "Araç paketi silindi",
      meta: {
        brandId,
        modelName,
        packageName,
      },
      req,
    });

    return res.status(200).json({
      message: "Paket başarıyla silindi.",
    });
  } catch (error) {
    console.error("Paket silme hatası:", error);

    await logger.error({
      type: "brand.package.delete.error",
      message: "Paket silinirken hata oluştu",
      meta: {
        error: error.message,
      },
      req,
    });

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
};

module.exports = {
  createBrandPriceList,
  addModelToBrand,
  addPackageToModel,
  updatePackagePrice,
  deletePackage,
  getAllBrandPriceLists,
  markBrandChecked,
  deleteBrandModel,
  deleteModelPackage
};
