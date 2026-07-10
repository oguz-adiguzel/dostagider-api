const cron = require("node-cron");
const CarListing = require("../models/CarListing");
const Showcase = require("../models/ShowcaseSchema");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../utils/cache");
const sendNotification = require("../utils/sendNotification");

cron.schedule("0 1 * * *", async () => {
  const startTime = new Date();

  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Süresi dolmasına 1 gün kalan ilanlar
    const expiringSoonListings = await CarListing.find({
      isActive: true,
      expirationWarningSent: false,
      expiresAt: {
        $gte: now,
        $lte: oneDayLater,
      },
    }).select("_id ilanNo user expiresAt isCorporate");

    for (const listing of expiringSoonListings) {
      await sendNotification({
        userId: listing.user,
        userModel: listing.isCorporate ? "CorporateUser" : "User",
        title: "İlan Süresi Doluyor",
        message: `${listing.ilanNo} numaralı ilanınızın süresi 1 gün içinde dolacaktır.`,
        type: "listing_expiring",
        link: `/ilan/${listing.ilanNo}`,
      });

      // tekrar bildirim gitmesin
      listing.expirationWarningSent = true;

      await listing.save();
    }
    // Süresi dolmuş aktif ilanlar
    const expiredListings = await CarListing.find({
      isActive: true,
      expiresAt: { $lte: now },
    }).select("_id isShowcased");

    const expiredCount = expiredListings.length;

    if (expiredCount > 0) {
      // ilan id listesi
      const listingIds = expiredListings.map((listing) => listing._id);

      // showcase olan ilanlar
      const showcasedIds = expiredListings
        .filter((listing) => listing.isShowcased)
        .map((listing) => listing._id);

      // Showcase kayıtlarını sil
      if (showcasedIds.length > 0) {
        await Showcase.deleteMany({
          listingId: { $in: showcasedIds },
        });

        // İlanlarda showcase alanını false yap
        await CarListing.updateMany(
          { _id: { $in: showcasedIds } },
          {
            $set: {
              isShowcased: false,
            },
          },
        );
      }

      // İlanları pasife çek
      await CarListing.updateMany(
        { _id: { $in: listingIds } },
        {
          $set: {
            isActive: false,
          },
        },
      );

      await deleteCacheByPattern("cache:/vitrin/active/home*");
    }

    // Başarılı log
    await logger.info({
      type: "listing.expire.cron",
      message: `Expire kontrolü tamamlandı. Pasife çekilen ilan sayısı: ${expiredCount}`,
      meta: {
        expiredCount,
        showcaseRemovedCount: expiredListings.filter((x) => x.isShowcased)
          .length,
        runTimeMs: Date.now() - startTime.getTime(),
      },
    });

    console.log("⏳ Süresi dolan ilanlar pasife çekildi:", expiredCount);

    await sendNotification({
      userId: "68f794c2293ce551aac96cc9",
      userModel: "Admin",
      title: "Log Clean Cron",
      message: `Süresi dolan ilanlar pasife çekilde ${expiredCount}`,
      type: "system",
      link: ``,
    });
  } catch (err) {
    console.error("❌ İlan expire cron hatası:", err);

    // ❗ Hata logu
    await logger.error({
      type: "listing.expire.cron_error",
      message: "Expire cron çalışırken hata oluştu",
      meta: {
        error: err.message,
        stack: err.stack,
      },
    });
  }
});
