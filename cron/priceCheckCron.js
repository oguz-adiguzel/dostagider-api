const cron = require("node-cron");
const BrandPriceList = require("../models/BrandPriceList");

const WARNING_DAYS = 14;

cron.schedule("0 2 * * *", async () => {
  console.log("🔍 Fiyat kontrol cron çalıştı");

  const brands = await BrandPriceList.find();

  const now = new Date();

  for (const brand of brands) {
    let hasRisk = false;

    brand.models.forEach((model) => {
      model.packages.forEach((pkg) => {
        if (!pkg.isActive) return;

        const diffDays =
          (now - new Date(pkg.lastUpdatedAt)) /
          (1000 * 60 * 60 * 24);

        if (diffDays >= WARNING_DAYS) {
          hasRisk = true;
        }
      });
    });

    // brand.hasPossibleUpdate = hasRisk;
    brand.hasPossibleUpdate = brand.hasPossibleUpdate || hasRisk;
    brand.lastCheckedAt = now;

    await brand.save();
  }
});
