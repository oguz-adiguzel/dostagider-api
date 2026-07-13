// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Geçici upload klasörü
// const uploadDir = "./uploads";
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;



const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Vercel serverless ortamındaysa sadece /tmp klasörüne yazma izni vardır
// Lokalindeyse eskisi gibi proje kökündeki ./uploads klasörünü kullanır
const uploadDir = process.env.VERCEL 
  ? path.join("/tmp", "uploads") 
  : "./uploads";

// Klasör yoksa hata vermeden (recursive) oluşturur (Lokal için geçerli, Vercel /tmp'i otomatik yönetir)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;