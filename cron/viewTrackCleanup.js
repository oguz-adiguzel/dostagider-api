const cron = require("node-cron");
const ViewTrack = require("../models/viewTrackModel");

// Her gün gece 03:00'te çalışır
cron.schedule("0 5 * * *", async () => {
  try {
    const limitDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await ViewTrack.deleteMany({
      viewedAt: { $lt: limitDate },
    });

    if (deleted.deletedCount > 0) {
      console.log(`🧹 ViewTrack temizlendi → ${deleted.deletedCount} kayıt silindi`);
    }
  } catch (err) {
    console.error("❌ ViewTrack cleanup cron hatası:", err);
  }
});
