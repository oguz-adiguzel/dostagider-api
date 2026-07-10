const express = require("express");
const router = express.Router();
const { createShowcaseRequest, approveShowcaseRequest, rejectShowcaseRequest, getPendingShowcaseRequests, getActiveShowcaseListings, getRandomShowcaseListings} = require("../controllers/showcaseRequestController");
const authMiddleware = require("../middleware/authMiddleware"); // token doğrulayan middleware

const cacheMiddleware = require("../middleware/cacheMiddleware");

/**
 * @swagger
 * tags:
 *   name: Showcase Listings
 *   description: Vitrin ilan işlemleri
 */

/**
 * @swagger
 * /showcase/request:
 *   post:
 *     summary: Kullanıcı bir ilan için vitrin talebi oluşturur
 *     tags: [Showcase Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ilanNo:
 *                 type: string
 *                 description: Vitrin talep edilecek ilan numarası
 *                 example: "123456"
 *               reason:
 *                 type: string
 *                 description: (Opsiyonel) Vitrin talebinin nedeni
 *                 example: "İlan daha fazla görünürlük kazanmalı"
 *     responses:
 *       201:
 *         description: Vitrin talebi başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vitrin talebi oluşturuldu. Admin onayı bekleniyor."
 *                 request:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60b8d295bce4db001f59e1e4"
 *                     listingId:
 *                       type: string
 *                       example: "60b8d295bce4db001f59e1e4"
 *                     requestedBy:
 *                       type: string
 *                       example: "60b8d295bce4db001f59e1e4"
 *                     reason:
 *                       type: string
 *                       example: "İlan daha fazla görünürlük kazanmalı"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Eksik bilgi (İlan numarası zorunludur)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ilanNo zorunludur."
 *       403:
 *         description: Kullanıcı, ilgili ilana talepte bulunmaya yetkin değil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bu ilana vitrin talebi yapmaya yetkiniz yok."
 *       404:
 *         description: Belirtilen ilan numarası bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "İlan bulunamadı."
 *       409:
 *         description: Zaten bekleyen bir vitrin talebi mevcut
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bu ilan için zaten bekleyen bir vitrin talebi mevcut."
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */
router.post("/request", authMiddleware(), createShowcaseRequest);

/**
 * @swagger
 * /showcase/request/approve/{id}:
 *   post:
 *     summary: Admin, bir vitrin talebini onaylar
 *     tags: [Showcase Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Onaylanacak vitrin talebinin ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminMessage:
 *                 type: string
 *                 description: Admin'in talep ile ilgili mesajı
 *                 example: "İlanın vitrin süresi 30 gün olarak ayarlandı."
 *     responses:
 *       200:
 *         description: Vitrin talebi başarıyla onaylandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vitrin talebi onaylandı."
 *                 showcase:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60b8d295bce4db001f59e1e4"
 *                     listingId:
 *                       type: string
 *                       example: "60b8d295bce4db001f59e1e4"
 *                     expiresAt:
 *                       type: string
 *                       example: "2022-12-25T00:00:00.000Z"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Talep daha önce işlenmiş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bu talep daha önce işlenmiş."
 *       404:
 *         description: Talep veya ilan bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Talep bulunamadı."
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */

router.post("/request/approve/:id", authMiddleware(["admin"]), approveShowcaseRequest);

/**
 * @swagger
 * /showcase/request/reject/{id}:
 *   post:
 *     summary: Admin, bir vitrin talebini reddeder
 *     tags: [Showcase Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reddedilecek vitrin talebinin ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminMessage:
 *                 type: string
 *                 description: Admin'in talep ile ilgili reddetme mesajı
 *                 example: "Vitrin talebi, ilan şartları sağlanmadığı için reddedildi."
 *     responses:
 *       200:
 *         description: Vitrin talebi başarıyla reddedildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vitrin talebi reddedildi."
 *       400:
 *         description: Talep daha önce işlenmiş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bu talep daha önce işlenmiş."
 *       404:
 *         description: Talep bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Talep bulunamadı."
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */

router.post("/request/reject/:id", authMiddleware(["admin"]), rejectShowcaseRequest);

/**
 * @swagger
 * /showcase/request/pending:
 *   get:
 *     summary: Admin, bekleyen vitrin taleplerini listeler
 *     tags: [Showcase Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bekleyen vitrin talepleri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       listingId:
 *                         type: object
 *                         properties:
 *                           ilanNo:
 *                             type: string
 *                             example: "123456"
 *                           baslik:
 *                             type: string
 *                             example: "2020 Model BMW X5"
 *                           gorseller:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "https://url.to/image.jpg"
 *                           sehir:
 *                             type: string
 *                             example: "Istanbul"
 *                           ilce:
 *                             type: string
 *                             example: "Kadıköy"
 *                           price:
 *                             type: integer
 *                             example: 100000
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-05-10T14:23:00Z"
 *       401:
 *         description: Yetkilendirme hatası (token geçersiz veya yok)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Yetkilendirme hatası"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */

router.get("/request/pending", authMiddleware(["admin"]), getPendingShowcaseRequests);


/**
 * @swagger
 * /showcase/active:
 *   get:
 *     summary: Aktif vitrin ilanlarını listeler
 *     tags: [Showcase Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktif vitrin ilanları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       listingId:
 *                         type: object
 *                         properties:
 *                           ilanNo:
 *                             type: string
 *                             example: "12345"
 *                           baslik:
 *                             type: string
 *                             example: "2020 Model BMW X5"
 *                           gorseller:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "https://url.to/image.jpg"
 *                           price:
 *                             type: integer
 *                             example: 300000
 *                           brand:
 *                             type: string
 *                             example: "BMW"
 *                           model:
 *                             type: string
 *                             example: "X5"
 *                           variant1:
 *                             type: string
 *                             example: "M Sport"
 *                           variant2:
 *                             type: string
 *                             example: "Full Option"
 *                           variant3:
 *                             type: string
 *                             example: "Panoramic Roof"
 *                           sehir:
 *                             type: string
 *                             example: "Istanbul"
 *                           ilce:
 *                             type: string
 *                             example: "Kadıköy"
 *                           aracYili:
 *                             type: integer
 *                             example: 2020
 *                           km:
 *                             type: integer
 *                             example: 25000
 *                           vites:
 *                             type: string
 *                             example: "Otomatik"
 *                           yakit:
 *                             type: string
 *                             example: "Benzin"
 *       401:
 *         description: Yetkilendirme hatası (token geçersiz veya yok)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Yetkilendirme hatası"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */

router.get("/active",cacheMiddleware(300), getActiveShowcaseListings);

router.get("/active/home",cacheMiddleware(300), getRandomShowcaseListings);

module.exports = router;
