const cron = require("node-cron");
const FeaturedGallery = require("../models/FeaturedGallery");
const logger = require("../utils/logger");


cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();

    const expired = await FeaturedGallery.updateMany(
      {
        status: "approved",
        endDate: { $lt: now },
      },
      {
        $set: { status: "expired" },
      },
    );

    if (expired.modifiedCount > 0) {
      console.log(
        `[CRON] ${expired.modifiedCount} öne çıkan galeri süresi doldu.`,
      );
       // ✅ Başarılı log
          await logger.info({
            type: "featured.gallery.cron",
            message: `Öneçıkan galeri kontrolü tamamlandı. Pasife çekilen ilan sayısı: ${expired.modifiedCount}`,
            meta: {
              expired,
            },
          });
    }
  } catch (error) {
    console.error("[CRON] FeaturedGallery error:", error);
  }
});
