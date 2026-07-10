const express = require("express");
const router = express.Router();
const { addBrand, getCarBrands, deleteBrand } = require("../controllers/carBrandController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../middleware/multer");

const cacheMiddleware = require("../middleware/cacheMiddleware");

/**
 * @swagger
 * tags:
 *   name: CarBrands
 *   description: Araç markaları ile ilgili işlemler
 */


/**
 * @swagger
 * /car-brands/add:
 *   post:
 *     summary: Yeni bir araç markası ekle
 *     tags: [CarBrands]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brandName:
 *                 type: string
 *                 description: Araç markasının adı
 *                 example: "Toyota"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Araç markasının logosu (görsel dosyası)
 *     responses:
 *       201:
 *         description: Araç markası başarıyla eklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka başarıyla eklendi."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Araç markasının benzersiz ID'si
 *                     brandName:
 *                       type: string
 *                       description: Araç markasının adı
 *                     logoUrl:
 *                       type: string
 *                       description: Logo görselinin URL'si
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Araç markasının oluşturulma tarihi
 *       400:
 *         description: Geçersiz giriş verisi veya eksik parametre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logo görseli gereklidir."
 *       500:
 *         description: Sunucu hatası, araç markası eklenirken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */
router.post(
  "/add",
  authMiddleware(["admin"]),
  upload.single("logo"),
  addBrand
);

/**
 * @swagger
 * /car-brands/all:
 *   get:
 *     summary: Tüm araç markalarını listele
 *     tags: [CarBrands]
 *     responses:
 *       200:
 *         description: Araç markaları başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka listesi getirildi."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Araç markasının benzersiz ID'si
 *                       brandName:
 *                         type: string
 *                         description: Araç markasının adı
 *                       logoUrl:
 *                         type: string
 *                         description: Araç markasının logo görselinin URL'si
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Araç markasının oluşturulma tarihi
 *       500:
 *         description: Sunucu hatası, araç markaları alınırken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka listesi getirilirken bir hata oluştu."
 *                 error:
 *                   type: string
 *                   description: Sunucu hatası detayları
 *                   example: "Database connection failed"
 */
router.get("/all", cacheMiddleware(300), getCarBrands);

/**
 * @swagger
 * /car-brands/{id}:
 *   delete:
 *     summary: Belirtilen araç markasını sil
 *     tags: [CarBrands]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Silinecek araç markasının benzersiz ID'si
 *         schema:
 *           type: string
 *           example: "60b8d295bce4db001f59e1e4"
 *     responses:
 *       200:
 *         description: Marka başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka ve logo başarıyla silindi."
 *       404:
 *         description: Marka bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka bulunamadı."
 *       500:
 *         description: Sunucu hatası, marka silinirken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marka silinirken bir hata oluştu."
 *                 error:
 *                   type: string
 *                   description: Sunucu hatası detayları
 *                   example: "Database connection failed"
 */
router.delete("/:id", authMiddleware(["admin"]), deleteBrand);

module.exports = router;
