const express = require("express");
const router = express.Router();
const { addBodyType, deleteBodyType, listBodyTypes } = require("../controllers/carBodyTypeController");

const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");


/**
 * @swagger
 * tags:
 *   name: CarBodyTypes
 *   description: Araç kasa tipleri ile ilgili işlemler
 */


/**
 * @swagger
 * /car-body-types:
 *   get:
 *     summary: Tüm araç kasa tiplerini listele
 *     tags: [CarBodyTypes]
 *     responses:
 *       200:
 *         description: Araç kasa tipleri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kasa tipleri getirildi."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Araç kasa tipinin benzersiz ID'si
 *                       bodyType:
 *                         type: string
 *                         description: Araç kasa tipinin adı
 *                       image:
 *                         type: string
 *                         description: Araç kasa tipi için resmin URL'si
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Araç kasa tipinin oluşturulma tarihi
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Araç kasa tipinin güncellenme tarihi
 *       500:
 *         description: Sunucu hatası, kasa tipi listeleme başarısız oldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */
router.get("/", cacheMiddleware(300),listBodyTypes);

/**
 * @swagger
 * /car-body-types/add:
 *   post:
 *     summary: Yeni bir araç kasa tipi ekle
 *     tags: [CarBodyTypes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bodyType:
 *                 type: string
 *                 description: Araç kasa tipinin adı
 *                 example: "Sedan"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Araç kasa tipi için görsel dosyası (ikon/resim)
 *     responses:
 *       201:
 *         description: Araç kasa tipi başarıyla eklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kasa tipi başarıyla eklendi."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Araç kasa tipinin benzersiz ID'si
 *                     bodyType:
 *                       type: string
 *                       description: Araç kasa tipinin adı
 *                     imageUrl:
 *                       type: string
 *                       description: Görselin URL'si
 *                     publicId:
 *                       type: string
 *                       description: Cloudinary'deki görselin public ID'si
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Oluşturulma tarihi
 *       400:
 *         description: Geçersiz giriş verisi veya eksik parametre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kasa tipi adı zorunludur."
 *       500:
 *         description: Sunucu hatası, kasa tipi eklenirken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */
router.post("/add", authMiddleware(["admin"]), upload.single("image"), addBodyType);

/**
 * @swagger
 * /car-body-types/{id}:
 *   delete:
 *     summary: Belirtilen ID'ye sahip araç kasa tipini sil
 *     tags: [CarBodyTypes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Silinecek araç kasa tipi ID'si
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Araç kasa tipi ve görsel başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kasa tipi ve görsel başarıyla silindi."
 *       404:
 *         description: Silinmek istenen araç kasa tipi bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kasa tipi bulunamadı."
 *       500:
 *         description: Silme işlemi sırasında sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Silme işlemi sırasında hata."
 */
router.delete("/:id", authMiddleware(["admin"]), deleteBodyType);

module.exports = router;
