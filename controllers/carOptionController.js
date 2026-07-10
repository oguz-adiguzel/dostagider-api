const CarOption = require("../models/carOption");
const ElectricCarOption = require("../models/EvCarOption");

const createCarOption = async (req, res) => {
  try {
    const { category, brand, model, variant1, variant2, variant3 } = req.body;

    if (!category || !brand || !model) {
      return res
        .status(400)
        .json({ message: "Kategori, marka ve model zorunludur." });
    }

    let categoryDoc = await CarOption.findOne({ category });

    // Kategori yoksa oluştur
    if (!categoryDoc) {
      categoryDoc = new CarOption({
        category,
        brands: [
          {
            brand,
            models: [
              {
                name: model,
                variants: variant1
                  ? [
                      {
                        variant1,
                        children: variant2
                          ? [
                              {
                                variant2,
                                children: variant3 ? [{ variant3 }] : [],
                              },
                            ]
                          : [],
                      },
                    ]
                  : [],
              },
            ],
          },
        ],
      });
      await categoryDoc.save();
      return res
        .status(201)
        .json({
          message: "Yeni kategori ve veriler eklendi.",
          data: categoryDoc,
        });
    }

    // Brand kontrolü
    let brandDoc = categoryDoc.brands.find((b) => b.brand === brand);
    if (!brandDoc) {
      categoryDoc.brands.push({
        brand,
        models: [
          {
            name: model,
            variants: variant1
              ? [
                  {
                    variant1,
                    children: variant2
                      ? [
                          {
                            variant2,
                            children: variant3 ? [{ variant3 }] : [],
                          },
                        ]
                      : [],
                  },
                ]
              : [],
          },
        ],
      });
      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni marka eklendi.", data: categoryDoc });
    }

    // Model kontrolü
    let modelDoc = brandDoc.models.find((m) => m.name === model);
    if (!modelDoc) {
      brandDoc.models.push({
        name: model,
        variants: variant1
          ? [
              {
                variant1,
                children: variant2
                  ? [
                      {
                        variant2,
                        children: variant3 ? [{ variant3 }] : [],
                      },
                    ]
                  : [],
              },
            ]
          : [],
      });
      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni model eklendi.", data: categoryDoc });
    }

    // Variant1 kontrolü
    let v1Doc = modelDoc.variants.find((v) => v.variant1 === variant1);
    if (!v1Doc) {
      modelDoc.variants.push({
        variant1,
        children: variant2
          ? [
              {
                variant2,
                children: variant3 ? [{ variant3 }] : [],
              },
            ]
          : [],
      });
      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni variant1 eklendi.", data: categoryDoc });
    }

    // Variant2 kontrolü
    let v2Doc = v1Doc.children.find((v) => v.variant2 === variant2);
    if (!v2Doc) {
      v1Doc.children.push({
        variant2,
        children: variant3 ? [{ variant3 }] : [],
      });
      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni variant2 eklendi.", data: categoryDoc });
    }

    // Variant3 kontrolü
    const v3Exists = v2Doc.children.find((v) => v.variant3 === variant3);
    if (!v3Exists && variant3) {
      v2Doc.children.push({ variant3 });
      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni variant3 eklendi.", data: categoryDoc });
    }

    return res
      .status(200)
      .json({
        message: "Zaten mevcut, değişiklik yapılmadı.",
        data: categoryDoc,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Hata oluştu", error });
  }
};

const createCategory = async (req, res) => {
  try {
    const { category } = req.body;

    // Boş kontrolü
    if (!category || category.trim() === "") {
      return res.status(400).json({ message: "Kategori adı zorunludur." });
    }

    // Aynı kategori zaten varsa
    const existing = await CarOption.findOne({ category });
    if (existing) {
      return res.status(400).json({ message: "Bu kategori zaten mevcut." });
    }

    // Yeni kategori oluştur
    const newCategory = new CarOption({
      category,
      brands: [],
    });

    await newCategory.save();

    return res.status(201).json({
      message: "Yeni kategori başarıyla eklendi.",
      data: newCategory,
    });
  } catch (error) {
    console.error("Kategori oluşturulurken hata:", error);
    return res.status(500).json({
      message: "Kategori oluşturulurken bir hata oluştu.",
      error: error.message,
    });
  }
};

const getAllCarOptions = async (req, res) => {
  try {
    const options = await CarOption.find({});
    res.status(200).json({ data: options });
  } catch (error) {
    console.error("Get CarOptions Error:", error);
    res.status(500).json({ message: "Araç verileri alınamadı", error });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await CarOption.distinct("category");
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error("Kategori çekme hatası:", error);
    res.status(500).json({ message: "Kategoriler alınamadı", error });
  }
};

const getFilteredCarOptions = async (req, res) => {
  try {
    const { category, brand, model, variant1, variant2, variant3 } = req.query;

    const pipeline = [];

    // Kategori filtresi
    if (category) {
      pipeline.push({
        $match: { category },
      });
    }

    // Brand filtresi
    if (brand) {
      pipeline.push({
        $addFields: {
          brands: {
            $filter: {
              input: "$brands",
              as: "b",
              cond: { $eq: ["$$b.brand", brand] },
            },
          },
        },
      });
    }

    // Model filtresi
    if (model) {
      pipeline.push({
        $addFields: {
          "brands.models": {
            $map: {
              input: "$brands",
              as: "b",
              in: {
                brand: "$$b.brand",
                models: {
                  $filter: {
                    input: "$$b.models",
                    as: "m",
                    cond: { $eq: ["$$m.name", model] },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Variant1 filtresi
    if (variant1) {
      pipeline.push({
        $addFields: {
          "brands.models": {
            $map: {
              input: "$brands.models",
              as: "m",
              in: {
                name: "$$m.name",
                variants: {
                  $filter: {
                    input: "$$m.variants",
                    as: "v1",
                    cond: { $eq: ["$$v1.variant1", variant1] },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Variant2 filtresi
    if (variant2) {
      pipeline.push({
        $addFields: {
          "brands.models.variants": {
            $map: {
              input: "$brands.models.variants",
              as: "v1",
              in: {
                variant1: "$$v1.variant1",
                children: {
                  $filter: {
                    input: "$$v1.children",
                    as: "v2",
                    cond: { $eq: ["$$v2.variant2", variant2] },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Variant3 filtresi
    if (variant3) {
      pipeline.push({
        $addFields: {
          "brands.models.variants.children": {
            $map: {
              input: "$brands.models.variants.children",
              as: "v2",
              in: {
                variant2: "$$v2.variant2",
                children: {
                  $filter: {
                    input: "$$v2.children",
                    as: "v3",
                    cond: { $eq: ["$$v3.variant3", variant3] },
                  },
                },
              },
            },
          },
        },
      });
    }

    const results = await CarOption.aggregate(pipeline);

    res.status(200).json({ data: results });
  } catch (error) {
    console.error("Filtreleme hatası:", error);
    res.status(500).json({ message: "Araç verileri alınamadı", error });
  }
};

const listingPageGetFilteredCarOptions = async (req, res) => {
  try {
    const { category, brand, model, variant1 } = req.query;

    // 1. VERİLERİ ÇEK
    const [carData, evData] = await Promise.all([
      CarOption.find().lean(),
      ElectricCarOption.find().lean(),
    ]);

    // 2. EV DATA NORMALIZE
    const normalizedEV = evData.map((cat) => ({
      category: cat.category,
      brands: cat.brands.map((b) => ({
        brand: b.brand,
        models: b.models.map((m) => ({
          name: m.name,
          variants: m.variants.map((v) => ({
            variant1: v.variant1,
            children: [], // 👈 kritik
          })),
        })),
      })),
    }));

    // 3. MERGE
    let merged = [...carData, ...normalizedEV];

    if (category) {
      merged = merged.filter(
        (c) => c.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // BRAND
    if (brand) {
      merged = merged.map((c) => ({
        ...c,
        brands: c.brands.filter((b) => b.brand === brand),
      }));
    }

    // MODEL
    if (model) {
      merged = merged.map((c) => ({
        ...c,
        brands: c.brands.map((b) => ({
          ...b,
          models: b.models.filter((m) => m.name === model),
        })),
      }));
    }

    // VARIANT1
    if (variant1) {
      merged = merged.map((c) => ({
        ...c,
        brands: c.brands.map((b) => ({
          ...b,
          models: b.models.map((m) => ({
            ...m,
            variants: m.variants.filter((v) => v.variant1 === variant1),
          })),
        })),
      }));
    }

    // 🔥 5. BOŞLARI TEMİZLE (ÇOK ÖNEMLİ)
    merged = merged
      .map((c) => ({
        ...c,
        brands: c.brands
          .map((b) => ({
            ...b,
            models: b.models
              .map((m) => ({
                ...m,
                variants: m.variants.filter((v) => v), // boş olmayan
              }))
              .filter((m) => m.variants.length > 0),
          }))
          .filter((b) => b.models.length > 0),
      }))
      .filter((c) => c.brands.length > 0);

    const grouped = {};

    merged.forEach((item) => {
      const key = item.category;

      if (!grouped[key]) {
        grouped[key] = {
          category: key,
          brands: [],
        };
      }

      grouped[key].brands.push(...item.brands);
    });

    merged = Object.values(grouped);

    res.status(200).json({ data: merged });
  } catch (error) {
    console.error("Combined filter error:", error);
    res.status(500).json({ message: "Veriler alınamadı" });
  }
};

module.exports = {
  createCarOption,
  getAllCarOptions,
  getAllCategories,
  getFilteredCarOptions,
  createCategory,
  listingPageGetFilteredCarOptions,
};
