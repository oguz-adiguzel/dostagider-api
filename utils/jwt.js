const jwt = require("jsonwebtoken");

// const generateAccessToken = (userId) => {
//   return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
//     expiresIn: "30m", // 1 dakika
//   });
// };

// const generateRefreshToken = (userId) => {
//   return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
//     expiresIn: "1h", // 5 dakika
//   });
// };


const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, // ✅ rol eklendi
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, // ✅ rol eklendi
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };