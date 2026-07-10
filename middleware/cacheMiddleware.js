const { redisClient } = require("../config/redis");

const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    try {
      // ✅ unique cache key oluştur
      const key = `cache:${req.originalUrl}`;

      // 🔍 CACHE CHECK
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        console.log("⚡ CACHE HIT:", key);
        return res.status(200).json(JSON.parse(cachedData));
      }

      console.log("🐢 DB HIT:", key);

      // ✅ res.json'ı override et
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // cache'e yaz
        redisClient.setEx(key, ttl, JSON.stringify(data));

        return originalJson(data);
      };

      next();

    } catch (err) {
      console.error("Cache middleware error:", err);
      next(); // hata olsa bile devam et
    }
  };
};

module.exports = cacheMiddleware;