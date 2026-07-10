// utils/logger.js
const Log = require("../models/Log");

const createLog = async ({ level = "info", type, message, meta = {}, req = null, userId = null, corporateUserId = null, listingId = null }) => {
  try {
    // quick console output
    const time = new Date().toISOString();
    console[level] ? console[level](`[${time}] [${level.toUpperCase()}] [${type}] ${message}`, meta) : console.log(`[${time}] [${level}] [${type}] ${message}`, meta);

    // build doc
    const doc = {
      level,
      type,
      message,
      meta,
      userId,
      corporateUserId,
      listingId,
      ip: req?.headers?.["x-forwarded-for"] || req?.ip || null,
    };

    // save async (don't await on calling site if you don't want to block; here we await to ensure persistence but you can choose not to)
    await Log.create(doc);
  } catch (err) {
    // DB'ye yazılamazsa bile uygulamayı bozmamak için sadece console'a yaz.
    console.error("Logger DB write error:", err);
  }
};

module.exports = {
  info: (opts) => createLog({ ...opts, level: "info" }),
  warn: (opts) => createLog({ ...opts, level: "warn" }),
  error: (opts) => createLog({ ...opts, level: "error" }),
  debug: (opts) => createLog({ ...opts, level: "debug" }),
};
