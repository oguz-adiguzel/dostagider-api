const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  approveCorporateUser,
  registerAdmin,
  loginAdmin,
  getAdminInfo,
  getPendingCorporateUsers,
  rejectCorporateUser,
  adminListingSearch,
  getLogs,
  getDashboardStats,
  getTotalCarListings,
  getWeeklyCarListings,
  getLast30DaysListingTrend,
  getWeeklyUserFlow,
  getTotalCorporateListings,
  getTotalBrands,
  getCorporateList,
  deleteInfoLogs,
  deleteLogById,
  getCacheKeys
} = require("../controllers/adminController");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Yönetici işlemleri
 */

/**
 * @swagger
 * /admin/approve-corporate/{userId}:
 *   patch:
 *     summary: Kurumsal kullanıcı hesabını admin tarafından onayla
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Onaylanacak kurumsal kullanıcının ID'si
 *     responses:
 *       200:
 *         description: Kurumsal hesap başarıyla onaylandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kurumsal hesap onaylandı."
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bulunamadı."
 *       500:
 *         description: Onay işlemi sırasında sunucu hatası oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Onay işlemi başarısız."
 */
router.patch(
  "/approve-corporate/:userId",
  authMiddleware(["admin"]),
  approveCorporateUser
);

/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: Yeni admin kaydı oluştur
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "adminUser"
 *               password:
 *                 type: string
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: Admin başarıyla kaydedildi
 *       400:
 *         description: Geçersiz veri veya eksik bilgi
 */
router.post("/register", registerAdmin);

/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: Yeni bir admin hesabı oluştur
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - sifre
 *               - isim
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               sifre:
 *                 type: string
 *                 example: "strongPassword123"
 *               isim:
 *                 type: string
 *                 example: "Ahmet Yılmaz"
 *               role:
 *                 type: string
 *                 example: "admin"
 *                 description: "Varsayılan olarak 'admin', istenirse 'superadmin' olabilir."
 *     responses:
 *       201:
 *         description: Admin başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin başarıyla oluşturuldu."
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "671f7b8c1a23b2f45c0d1234"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     isim:
 *                       type: string
 *                       example: "Ahmet Yılmaz"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: Eksik alanlar gönderildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lütfen tüm alanları doldurun."
 *       409:
 *         description: Bu email adresi zaten kayıtlı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bu email adresi zaten kayıtlı."
 *       500:
 *         description: Admin oluşturulurken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin oluşturulurken bir hata oluştu."
 */
router.post("/login", loginAdmin);

/**
 * @swagger
 * /admin/me:
 *   get:
 *     summary: Giriş yapmış olan adminin bilgilerini getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bilgileri getirildi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "671f8c4b2b13e6f05a0a9a21"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     isim:
 *                       type: string
 *                       example: "Ahmet Yılmaz"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bulunamadı."
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası."
 */
router.get("/me", authMiddleware(["admin"]), getAdminInfo);

/**
 * @swagger
 * /admin/pending:
 *   get:
 *     summary: Onay bekleyen kurumsal kullanıcıları listele
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Onay bekleyen kurumsal kullanıcılar başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       galeriAdi:
 *                         type: string
 *                         example: "Yılmazlar Otomotiv"
 *                       email:
 *                         type: string
 *                         example: "info@yilmazlarotomotiv.com"
 *                       telefon:
 *                         type: string
 *                         example: "+90 532 123 4567"
 *                       yetkiliAdi:
 *                         type: string
 *                         example: "Ahmet"
 *                       yetkiliSoyadi:
 *                         type: string
 *                         example: "Yılmaz"
 *                       vergiDairesi:
 *                         type: string
 *                         example: "İstanbul Beyoğlu"
 *                       vergiNo:
 *                         type: string
 *                         example: "1234567890"
 *                       sehir:
 *                         type: string
 *                         example: "İstanbul"
 *                       ilce:
 *                         type: string
 *                         example: "Kadıköy"
 *                       mahalle:
 *                         type: string
 *                         example: "Caferağa Mahallesi"
 *                       hesapOlusturmaTarihi:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-28T10:15:30.000Z"
 *       500:
 *         description: Kullanıcılar alınırken sunucu hatası oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcılar alınamadı."
 */
router.get("/pending", authMiddleware(["admin"]), getPendingCorporateUsers);

/**
 * @swagger
 * /admin/reject/{id}:
 *   delete:
 *     summary: Kurumsal kullanıcı başvurusunu reddet ve hesabı sil
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reddedilecek kurumsal kullanıcının ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı reddedildi ve silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı reddedildi ve silindi"
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bulunamadı"
 *       500:
 *         description: Reddetme işlemi sırasında bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bir hata oluştu"
 */
router.delete("/reject/:id", authMiddleware(["admin"]), rejectCorporateUser);


/**
 * @swagger
 * /search:
 *   get:
 *     summary: "Araba ilanlarını ilan numarasına göre arar"
 *     description: "Admin, araba ilanlarını ilan numarasına göre arar. İlan numarası en az 4 karakter uzunluğunda olmalıdır."
 *     tags:
 *       - "Admin"
 *     parameters:
 *       - in: query
 *         name: ilanNo
 *         required: true
 *         description: "Arama yapılacak ilan numarası. En az 4 karakter uzunluğunda olmalıdır."
 *         schema:
 *           type: string
 *           example: "ABC1234"
 *     responses:
 *       200:
 *         description: "Arama başarıyla tamamlandı ve ilanlar döndürüldü."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ilanNo:
 *                         type: string
 *                         example: "ABC1234"
 *                       baslik:
 *                         type: string
 *                         example: "2020 Honda Civic"
 *                       price:
 *                         type: string
 *                         example: "20000"
 *       400:
 *         description: "Bad Request - Eğer ilan numarası eksik veya çok kısa ise"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "En az 4 karakter gerekli."
 *       500:
 *         description: "Sunucu hatası."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası"
 *     
 */
router.get("/search", authMiddleware(["admin"]), adminListingSearch);


/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Sistem loglarını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Getirilecek logların sayfası
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Sayfa başına getirilecek log sayısı
 *       - in: query
 *         name: level
 *         required: false
 *         schema:
 *           type: string
 *         description: Log seviyesini filtrele (örneğin, "info", "error")
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *         description: Log türünü filtrele
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: Log kaydını oluşturan kullanıcının ID'si
 *       - in: query
 *         name: listingId
 *         required: false
 *         schema:
 *           type: string
 *         description: İlgili listeleme ID'sini filtrele
 *       - in: query
 *         name: from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Logların başlangıç tarihini filtrele (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Logların bitiş tarihini filtrele (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Loglar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 5
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Log kayıt ID'si
 *                       level:
 *                         type: string
 *                         description: Log seviyesini belirtir
 *                       type:
 *                         type: string
 *                         description: Log türünü belirtir
 *                       message:
 *                         type: string
 *                         description: Log mesajı
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Log kaydının oluşturulma zamanı
 *                       userId:
 *                         type: string
 *                         description: Log kaydını oluşturan kullanıcının ID'si
 *                       listingId:
 *                         type: string
 *                         description: İlgili listeleme ID'si
 *       500:
 *         description: Logları getirirken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Log alınırken hata oluştu."
 */

router.get("/logs",authMiddleware(["admin"]), getLogs);

router.delete('/logs/info-delete', authMiddleware(["admin"]), deleteInfoLogs)

router.delete("/logs/:id", authMiddleware(["admin"]), deleteLogById);

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Admin dashboard istatistiklerini getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard verileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 1000
 *                       description: Toplam bireysel kullanıcı sayısı
 *                     totalCorporateUsers:
 *                       type: integer
 *                       example: 200
 *                       description: Toplam kurumsal kullanıcı sayısı
 *                     totalAllUsers:
 *                       type: integer
 *                       example: 1200
 *                       description: Toplam tüm kullanıcı sayısı (bireysel + kurumsal)
 *       500:
 *         description: Dashboard verileri alınırken bir hata oluştu
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
 *                   example: "Dashboard verileri alınamadı."
 */
router.get("/dashboard/stats", getDashboardStats);


/**
 * @swagger
 * /admin/dashboard/total-listings:
 *   get:
 *     summary: Admin paneli için toplam araba ilanlarını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Toplam ilan verileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalListings:
 *                       type: integer
 *                       example: 1500
 *                       description: Toplam araba ilanı sayısı
 *                     activeListings:
 *                       type: integer
 *                       example: 1200
 *                       description: Aktif araba ilanı sayısı
 *                     passiveListings:
 *                       type: integer
 *                       example: 300
 *                       description: Pasif araba ilanı sayısı
 *       500:
 *         description: Toplam ilan verileri alınırken bir hata oluştu
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
 *                   example: "Toplam ilan sayısı alınamadı."
 */
router.get("/dashboard/total-listings", getTotalCarListings);


/**
 * @swagger
 * /admin/dashboard/weekly-listings:
 *   get:
 *     summary: Haftalık araba ilanı sayısını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Haftalık ilan sayısı başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     weeklyListings:
 *                       type: integer
 *                       example: 45
 *                       description: Haftalık eklenen araba ilanı sayısı
 *                     startOfWeek:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-30T00:00:00.000Z"
 *                       description: Haftanın başlangıcı (Pazartesi)
 *                     today:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-02T14:23:00.000Z"
 *                       description: Bugünün tarihi
 *       500:
 *         description: Haftalık ilan verileri alınırken bir hata oluştu
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
 *                   example: "Haftalık ilan sayısı alınamadı."
 */
router.get("/dashboard/weekly-listings", getWeeklyCarListings);


/**
 * @swagger
 * /admin/dashboard/listing-trend:
 *   get:
 *     summary: Son 30 günün ilan trendini getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Son 30 günün ilan trendi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-11-01"
 *                         description: İlanın tarihi (YYYY-MM-DD)
 *                       count:
 *                         type: integer
 *                         example: 5
 *                         description: O gün içinde eklenen ilan sayısı
 *       500:
 *         description: Trend verisi alınırken bir hata oluştu
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
 *                   example: "Trend verisi alınamadı."
 */
router.get("/dashboard/listing-trend", getLast30DaysListingTrend);


/**
 * @swagger
 * /admin/dashboard/weekly-user-flow:
 *   get:
 *     summary: Son 7 günün kullanıcı akışını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Haftalık kullanıcı akışı başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-11-01"
 *                         description: Kullanıcı kayıtlarının tarihi (YYYY-MM-DD)
 *                       count:
 *                         type: integer
 *                         example: 10
 *                         description: O gün içinde kayıt olan toplam kullanıcı sayısı (bireysel + kurumsal)
 *       500:
 *         description: Haftalık kullanıcı akışı verisi alınırken bir hata oluştu
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
 *                   example: "Haftalık kullanıcı akışı getirilemedi."
 */
router.get("/dashboard/weekly-user-flow", getWeeklyUserFlow);


/**
 * @swagger
 * /admin/dashboard/corporate-listing-count:
 *   get:
 *     summary: Kurumsal ve bireysel kullanıcıların ilan sayısını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Kurumsal ve bireysel ilan sayıları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCorporateListings:
 *                       type: integer
 *                       example: 120
 *                       description: Kurumsal kullanıcıların toplam ilan sayısı
 *                     totalIndividualListings:
 *                       type: integer
 *                       example: 350
 *                       description: Bireysel kullanıcıların toplam ilan sayısı
 *       500:
 *         description: İlan sayıları alınırken bir hata oluştu
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
 *                   example: "İlan sayısı alınamadı."
 */
router.get("/dashboard/corporate-listing-count", getTotalCorporateListings);


/**
 * @swagger
 * /admin/dashboard/total-brands:
 *   get:
 *     summary: Toplam marka sayısını getir
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Toplam marka sayısı başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalBrands:
 *                   type: integer
 *                   example: 50
 *                   description: Sistemdeki toplam marka sayısı
 *       500:
 *         description: Marka sayısı alınırken bir hata oluştu
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
 *                   example: "Marka sayısı alınamadı."
 *                 error:
 *                   type: string
 *                   example: "Error message from the server"
 */
router.get("/dashboard/total-brands", getTotalBrands);


router.get("/corporate-list", authMiddleware(["admin"]), getCorporateList);

router.get("/cache-list", getCacheKeys);



module.exports = router;
