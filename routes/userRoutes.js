const express = require("express");
const router = express.Router();
const { registerUser, loginUser, refreshAccessToken, addToFavorites, getUserInfo, checkFavoriteStatus,removeFromFavorites, updateUserProfile, logoutUser, verifyUser, registerCorporateUser, updateCorporateUser, forgotPassword, resetPassword,getUserList  } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../middleware/multer");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kullanıcı işlemleri
 */


/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Kullanıcı kaydı oluştur
 *     tags: [Users]
 */
router.post("/register", registerUser);

router.get("/user-list", authMiddleware(["admin"]), getUserList)

/**
 * @swagger
 * /users/register-corporate:
 *   post:
 *     summary: Kurumsal kullanıcı kaydı oluştur
 *     tags: [Users]
 */
router.post("/register-corporate", registerCorporateUser);


/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Hesap doğrula
 *     tags: [Users]
 */
router.post("/verify", verifyUser);



/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Kullanıcı girişi yap
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - sifre
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               sifre:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Giriş başarılı, access token döner ve refresh token cookie olarak set edilir
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Giriş başarılı.
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                 userId:
 *                   type: string
 *                   example: 6523d77f96d9f8a4513cb3e9
 *       400:
 *         description: Email ve şifre eksik
 *       401:
 *         description: Email veya şifre hatalı
 *       500:
 *         description: Sunucu hatası
 */

router.post("/login", loginUser);


router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Access token yenile
 *     tags: [Users]
 */
router.post("/refresh", refreshAccessToken);

/**
 * @swagger
 * /users/favori-ekle:
 *   post:
 *     summary: Favorilere ilan ekle
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 */
router.post("/favori-ekle", authMiddleware(), addToFavorites);

/**
 * @swagger
 * /users/remove-favorite:
 *   post:
 *     summary: Favorilerden ilan çıkar
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 */
router.post("/remove-favorite", authMiddleware(), removeFromFavorites);

/**
 * @swagger
 * /users/user-info:
 *   get:
 *     summary: Giriş yapan kullanıcının bilgilerini getir
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 */
router.get("/user-info", authMiddleware(), getUserInfo);

/**
 * @swagger
 * /users/status/{listingId}:
 *   get:
 *     summary: Bir ilanın favoride olup olmadığını kontrol et
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *         description: İlan ID
 */
router.get("/status/:listingId", authMiddleware(), checkFavoriteStatus);


/**
 * @swagger
 * /users/profil-guncelle:
 *   put:
 *     summary: Kullanıcı bilgilerini güncelle
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *         description: İlan ID
 */
router.put("/profil-guncelle", authMiddleware(), updateUserProfile);


/**
 * @swagger
 * /users/corporate-update/{id}:
 *   put:
 *     summary: Kurumsal kullanıcı bilgilerini güncelle
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Güncellenecek kurumsal kullanıcının ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               galeriAdi:
 *                 type: string
 *                 example: "TechCompany"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Yeni logo resmi
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: Yeni kapak fotoğrafı
 *               hakkimizda:
 *                 type: string
 *                 example: "TechCompany, teknoloji sektöründe lider bir firmadır."
 *               telefon:
 *                 type: string
 *                 example: "+90 555 555 55 55"
 *               yetkiliAdi:
 *                 type: string
 *                 example: "Ali"
 *               yetkiliSoyadi:
 *                 type: string
 *                 example: "Veli"
 *               sehir:
 *                 type: string
 *                 example: "İstanbul"
 *               ilce:
 *                 type: string
 *                 example: "Kadıköy"
 *               mahalle:
 *                 type: string
 *                 example: "Yenisahra"
 *               acikAdres:
 *                 type: string
 *                 example: "Örnek Mah. No:23, Kadıköy, İstanbul"
 *               calismaSaatleri:
 *                 type: string
 *                 example: "Pazartesi-Cumartesi: 09:00 - 18:00"
 *     responses:
 *       200:
 *         description: Kurumsal kullanıcı bilgileri başarıyla güncellendi
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
 *                   example: "Kurumsal kullanıcı bilgileri başarıyla güncellendi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "607a4f5b8f1b2b001f3a4f29"
 *                     galeriAdi:
 *                       type: string
 *                       example: "TechCompany"
 *                     logoUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/logo.png"
 *                     coverPhotoUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/cover.jpg"
 *       400:
 *         description: Geçersiz veya eksik parametreler
 *       401:
 *         description: Yetkilendirme hatası
 *       404:
 *         description: Kurumsal kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

router.put(
  "/corporate-update/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateCorporateUser
);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Kullanıcı çıkışı yapar (refresh token silinir)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Çıkış başarılı, refresh token silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Çıkış başarılı."
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Çıkış yapılamadı."
 */

router.post("/logout", logoutUser);

module.exports = router;