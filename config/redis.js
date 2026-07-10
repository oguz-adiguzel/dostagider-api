const { createClient } = require("redis");

const redisClient = createClient({
  url: "rediss://default:gQAAAAAAAndpAAIgcDFmMTA0YmI1NmNlMDQ0NDRhYmYyNmViMGE1NDcyOTE1Ng@living-ladybug-161641.upstash.io:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

module.exports = {
  redisClient,
  connectRedis,
};