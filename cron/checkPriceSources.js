const cron = require("node-cron");
const axios = require("axios");
const BrandPriceList = require("../models/BrandPriceList");
const crypto = require("crypto");
const logger = require("../utils/logger");
const sendNotification = require("../utils/sendNotification");

/* ---------------- HELPERS ---------------- */

const normalizeHtml = (html) => {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const generateHash = (content) => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

/* ---------------- CRON ---------------- */

cron.schedule("0 3 * * *", async () => {
  const brands = await BrandPriceList.find({
    sourceUrl: { $exists: true, $ne: "" },
  });

  for (const brand of brands) {
    try {
      const response = await axios.get(brand.sourceUrl, {
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0 PriceBot",
        },
      });

      const rawHtml = response.data;
      const normalizedContent = normalizeHtml(rawHtml);

      const newHash = generateHash(normalizedContent);
      const newLength = normalizedContent.length;
      const now = new Date();

      /* 🔹 İLK KEZ KONTROL (BASELINE) */
      if (!brand.sourceHash) {
        brand.sourceHash = newHash;
        brand.sourceContentLength = newLength;
        brand.sourceLastCheckedAt = now;

        await brand.save();
        continue;
      }

      /* 🔹 DEĞİŞİKLİK KONTROLÜ */
      let hasChange = false;

      const oldLength = brand.sourceContentLength || 0;

      const lengthDiffRatio =
        oldLength > 0 ? Math.abs(oldLength - newLength) / oldLength : 0;

      if (brand.sourceHash !== newHash) {
        // Büyük değişiklik → kesin alarm
        if (lengthDiffRatio > 0.01) {
          hasChange = true;
        }

        // Küçük ama anlamlı değişiklik
        if (lengthDiffRatio <= 0.01) {
          hasChange = true;
        }
      }
      /* 🔹 GÜNCELLE */
      brand.sourceHash = newHash;
      brand.sourceContentLength = newLength;
      brand.sourceLastCheckedAt = now;

      if (hasChange) {
        brand.hasPossibleUpdate = brand.hasPossibleUpdate || true;
        brand.sourceChangedAt = now;

        console.log(`⚠️ Kaynak değişikliği algılandı: ${brand.brand}`);

        // ✅ Başarılı log
        await logger.info({
          type: "checkPrice.source.cron",
          message: `Markada fiyat değişikliği algılandı: ${brand.brand}`,
          meta: {
            brand: brand.brand,
          },
        });
      }

      await brand.save();
    } catch (err) {
      console.error(`❌ Kaynak kontrol hatası (${brand.brand}):`, err.message);
    }
  }
  await sendNotification({
    userId: "68f794c2293ce551aac96cc9",
    userModel: "Admin",
    title: "Sıfır Araç Listesi Cron",
    message: `Sıfır araç listesi kontrol et`,
    type: "system",
    link: ``,
  });
});
