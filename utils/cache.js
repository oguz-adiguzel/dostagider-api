const { redisClient } = require("../config/redis");

// ✅ Cache GET
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache GET error:", err);
    return null;
  }
};

// ✅ Cache SET
const setCache = async (key, data, ttl = 300) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error("Cache SET error:", err);
  }
};

// ✅ Tek key sil
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("Cache DELETE error:", err);
  }
};

// ✅ Pattern ile sil
const deleteCacheByPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error("Cache PATTERN DELETE error:", err);
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
};