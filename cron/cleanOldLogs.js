// cron/cleanOldLogs.js
const cron = require("node-cron");
const Log = require("../models/Log");
const sendNotification = require("../utils/sendNotification");

// Her gün 03:00'te çalışsın (örn). Test için kolaylıkla daha sık yapabilirsin.
cron.schedule("0 3 * * *", async () => {
  try {
    const days = Number(process.env.LOG_RETENTION_DAYS) || 60;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const res = await Log.deleteMany({ createdAt: { $lt: cutoff } });
    console.log(`🧹 Eski log temizleme: ${res.deletedCount} kayıt silindi.`);
    await sendNotification({
      userId: "68f794c2293ce551aac96cc9",
      userModel: "Admin",
      title: "Log Clean Cron",
      message: `Eski logları silen cron çalıştı`,
      type: "system",
      link: ``,
    });
  } catch (err) {
    console.error("Log temizleme hatası:", err);
  }
});

module.exports = {};
