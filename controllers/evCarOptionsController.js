const ElectricCarOption = require("../models/EvCarOption");

const createElectricCarOption = async (req, res) => {
  try {
    const {
      category,
      brand,
      model,
      variant1,
      range,
      batteryCapacity,
      avgConsumption,
      motorPower,
    } = req.body;

    if (!category || !brand || !model) {
      return res.status(400).json({
        message: "Kategori, marka ve model zorunludur.",
      });
    }

    // 🔹 Teknik veri objesi oluştur
    const technicalData = {};
    if (range !== undefined) technicalData.range = range;
    if (batteryCapacity !== undefined)
      technicalData.batteryCapacity = batteryCapacity;
    if (avgConsumption !== undefined)
      technicalData.avgConsumption = avgConsumption;
    if (motorPower !== undefined) technicalData.motorPower = motorPower;

    const hasTechnical = Object.keys(technicalData).length > 0;

    let categoryDoc = await ElectricCarOption.findOne({ category });

    // 🔹 KATEGORİ YOKSA
    if (!categoryDoc) {
      categoryDoc = new ElectricCarOption({
        category,
        brands: [
          {
            brand,
            models: [
              {
                name: model,
                technical:
                  !variant1 && hasTechnical ? technicalData : undefined,
                variants: variant1
                  ? [
                      {
                        variant1,
                        technical: hasTechnical ? technicalData : undefined,
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
        .json({ message: "Yeni kategori eklendi", data: categoryDoc });
    }

    // 🔹 BRAND KONTROL
    let brandDoc = categoryDoc.brands.find((b) => b.brand === brand);

    if (!brandDoc) {
      categoryDoc.brands.push({
        brand,
        models: [
          {
            name: model,
            technical: !variant1 && hasTechnical ? technicalData : undefined,
            variants: variant1
              ? [
                  {
                    variant1,
                    technical: hasTechnical ? technicalData : undefined,
                  },
                ]
              : [],
          },
        ],
      });

      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni marka eklendi", data: categoryDoc });
    }

    // 🔹 MODEL KONTROL
    let modelDoc = brandDoc.models.find((m) => m.name === model);

    if (!modelDoc) {
      brandDoc.models.push({
        name: model,
        technical: !variant1 && hasTechnical ? technicalData : undefined,
        variants: variant1
          ? [
              {
                variant1,
                technical: hasTechnical ? technicalData : undefined,
              },
            ]
          : [],
      });

      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni model eklendi", data: categoryDoc });
    }

    // 🔹 VARIANT1 YOKSA → MODEL TEKNİK MERGE
    if (!variant1) {
      if (hasTechnical) {
        modelDoc.technical = {
          ...(modelDoc.technical || {}),
          ...technicalData,
        };

        await categoryDoc.save();
        return res.status(200).json({
          message: "Model teknik verisi merge edildi",
          data: categoryDoc,
        });
      }

      return res
        .status(200)
        .json({ message: "Model mevcut", data: categoryDoc });
    }

    // 🔹 VARIANT1 KONTROL
    let variantDoc = modelDoc.variants.find((v) => v.variant1 === variant1);

    // Variant yoksa oluştur
    if (!variantDoc) {
      modelDoc.variants.push({
        variant1,
        technical: hasTechnical ? technicalData : undefined,
      });

      await categoryDoc.save();
      return res
        .status(201)
        .json({ message: "Yeni variant1 eklendi", data: categoryDoc });
    }

    // 🔹 VARIANT VARSA → MERGE YAP
    if (hasTechnical) {
      variantDoc.technical = {
        ...(variantDoc.technical || {}),
        ...technicalData,
      };

      await categoryDoc.save();
      return res.status(200).json({
        message: "Variant teknik verisi merge edildi",
        data: categoryDoc,
      });
    }

    return res.status(200).json({ message: "Zaten mevcut", data: categoryDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Hata oluştu", error });
  }
};

const getAllElectricCarOptions = async (req, res) => {
  try {
    const data = await ElectricCarOption.find({}).lean();

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error("GET ELECTRIC CAR OPTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Elektrikli araç verileri alınırken hata oluştu",
    });
  }
};

const createCategory = async (req, res) => {
  try {
    let { category } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Kategori alanı zorunludur",
      });
    }

    // normalize (isteğe bağlı ama önerilir)
    category = category.trim();

    // Aynı kategori var mı kontrol
    const existing = await ElectricCarOption.findOne({ category });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bu kategori zaten mevcut",
      });
    }

    // Yeni kategori oluştur
    const newCategory = await ElectricCarOption.create({
      category,
      brands: [],
    });

    return res.status(201).json({
      success: true,
      message: "Kategori başarıyla oluşturuldu",
      data: newCategory,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Kategori oluşturulurken hata oluştu",
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await ElectricCarOption.find(
      {},
      { category: 1, _id: 0 },
    ).lean();

    // sadece string array dönmek için map
    const categoryList = categories.map((item) => item.category);

    return res.status(200).json({
      success: true,
      count: categoryList.length,
      data: categoryList,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Kategoriler alınırken hata oluştu",
    });
  }
};

const getFilteredElectricOptions = async (req, res) => {
  try {
    const { category, brand, model, variant1, includeTechnical } = req.query;

    const pipeline = [];

    // 1️⃣ CATEGORY FILTER
    if (category) {
      pipeline.push({
        $match: { category },
      });
    }

    // 2️⃣ BRAND FILTER
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

    // 3️⃣ MODEL FILTER
    if (model) {
      pipeline.push({
        $addFields: {
          brands: {
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

    // 4️⃣ VARIANT1 FILTER
    if (variant1) {
      pipeline.push({
        $addFields: {
          brands: {
            $map: {
              input: "$brands",
              as: "b",
              in: {
                brand: "$$b.brand",
                models: {
                  $map: {
                    input: "$$b.models",
                    as: "m",
                    in: {
                      name: "$$m.name",
                      technical: "$$m.technical",
                      variants: {
                        $filter: {
                          input: "$$m.variants",
                          as: "v",
                          cond: { $eq: ["$$v.variant1", variant1] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // 5️⃣ TECHNICAL GÖNDERİLMEYECEKSE SİL
    if (includeTechnical !== "true") {
      pipeline.push({
        $addFields: {
          brands: {
            $map: {
              input: "$brands",
              as: "b",
              in: {
                brand: "$$b.brand",
                models: {
                  $map: {
                    input: "$$b.models",
                    as: "m",
                    in: {
                      name: "$$m.name",
                      variants: {
                        $map: {
                          input: "$$m.variants",
                          as: "v",
                          in: {
                            variant1: "$$v.variant1",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    const results = await ElectricCarOption.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("FILTER ELECTRIC ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Elektrikli araç verileri filtrelenemedi",
    });
  }
};

module.exports = {
  createElectricCarOption,
  getAllElectricCarOptions,
  createCategory,
  getAllCategories,
  getFilteredElectricOptions,
};
