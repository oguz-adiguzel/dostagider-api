const cron = require("node-cron");
const Showcase = require("../models/ShowcaseSchema");
const { deleteCacheByPattern } = require("../utils/cache");
const logger = require("../utils/logger");

// Her gün saat 00.00'da vitrin süresi dolan ilanları pasif yapar
cron.schedule("0 4 * * *", async () => {
  try {
    console.log("⏳ Vitrin süresi takip cron çalıştı...");

    const now = new Date();

    const expiredShowcases = await Showcase.updateMany(
      {
        expiresAt: { $lte: now },
        isActive: true,
      },
      { isActive: false },
    );

    const expiredShowcasesCount = expiredShowcases.length;

    await deleteCacheByPattern("cache:/vitrin/active/home*");
    await deleteCacheByPattern("cache:/vitrin/active*");

    // ✅ Başarılı log
    await logger.info({
      type: "listing.expire.cron",
      message: `Vitrin kontrolü tamamlandı. Pasife çekilen ilan sayısı: ${expiredShowcasesCount}`,
      meta: {
        expiredShowcasesCount,
      },
    });

    console.log(
      `✔ Vitrin süresi dolan ilanlar pasif edildi: ${expiredShowcases.modifiedCount}`,
    );
  } catch (error) {
    console.error("❌ Showcase cron error:", error);
  }
});
