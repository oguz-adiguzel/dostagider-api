const express = require("express");
const router = express.Router();
const {
  createCarListing,
  getAllCarListings,
  filterCarListings,
  searchCarListings,
  getCarListingByIlanNo,
  updateCarListing,
  updateCarListingImage,
  addImagesToCarListing,
  reorderCarListingImages,
  deleteCarListingImage,
  deleteCarListingByIlanNo,
  getUserListings,
  getUserFavorites,
  renewListing,
  estimateCarValue,
  getCarListingForUpdate,
  getLatestCarListings
} = require("../controllers/carListingController");
const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authMiddleware");
const { USER_ROLES } = require("../utils/constant");

/**
 * @swagger
 * tags:
 *   name: Car Listings
 *   description: Araç ilan işlemleri
 */

/**
 * @swagger
 * /car-listings/ilan-ekle:
 *   post:
 *     summary: Yeni araç ilanı oluştur
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - baslik
 *               - price
 *               - brand
 *               - model
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Araç görselleri (en fazla 10 adet)
 *               baslik:
 *                 type: string
 *                 example: "Temiz kullanılmış 2018 model"
 *               price:
 *                 type: number
 *                 example: 450000
 *               category:
 *                 type: string
 *                 example: "SUV"
 *               brand:
 *                 type: string
 *                 example: "Volkswagen"
 *               model:
 *                 type: string
 *                 example: "Tiguan"
 *               variant1:
 *                 type: string
 *               variant2:
 *                 type: string
 *               variant3:
 *                 type: string
 *               aracYili:
 *                 type: integer
 *                 example: 2018
 *               yakit:
 *                 type: string
 *                 example: "Dizel"
 *               vites:
 *                 type: string
 *                 example: "Otomatik"
 *               km:
 *                 type: integer
 *                 example: 85000
 *               kasaTipi:
 *                 type: string
 *                 example: "SUV"
 *               garanti:
 *                 type: string
 *                 example: "Yok"
 *               agirHasarKaydi:
 *                 type: string
 *                 example: "Yok"
 *               takas:
 *                 type: boolean
 *                 example: true
 *               aciklama:
 *                 type: string
 *                 example: "Araç çok temizdir, ekspertiz raporu mevcuttur."
 *               teknikOzellikler:
 *                 type: string
 *                 description: JSON string formatında teknik özellikler
 *                 example: '{"guvenlik":{"abs":true,"airbag":true},"icDonanim":{"klima":true}}'
 *               ekspertiz:
 *                 type: string
 *                 description: JSON string formatında ekspertiz bilgisi
 *                 example: '{"kaput":"Orijinal","tavan":"Orijinal"}'
 *               noExpertiz:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: İlan başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "İlan başarıyla oluşturuldu."
 *                 ilan:
 *                   type: object
 *                   description: Oluşturulan ilan nesnesi
 */
router.post(
  "/ilan-ekle",
  authMiddleware(),
  upload.array("images", 10),
  createCarListing
);

/**
 * @swagger
 * /car-listings/tum-ilanlar:
 *   get:
 *     summary: Tüm araç ilanlarını getir (sayfalama destekli)
 *     tags: [Car Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası (her sayfada 10 ilan gösterilir)
 *     responses:
 *       200:
 *         description: İlanlar başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalListings:
 *                   type: integer
 *                   example: 48
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       baslik:
 *                         type: string
 *                       price:
 *                         type: number
 *                       brand:
 *                         type: string
 *                       model:
 *                         type: string
 *                       gorseller:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 */

router.get("/tum-ilanlar", getAllCarListings);

router.get("/yeni-ilanlar", getLatestCarListings);

/**
 * @swagger
 * /car-listings/filtrele:
 *   get:
 *     summary: Araç ilanlarını filtrele
 *     tags: [Car Listings]
 *     parameters:
 *       - in: query
 *         name: marka
 *         schema:
 *           type: string
 *       - in: query
 *         name: fiyatMax
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Filtreleme başarılı
 */
router.get("/filtrele", filterCarListings);

/**
 * @swagger
 * /car-listings/arama:
 *   get:
 *     summary: Arama yap
 *     tags: [Car Listings]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Aranacak kelime
 *     responses:
 *       200:
 *         description: Arama sonuçları
 */
router.get("/arama", searchCarListings);

/**
 * @swagger
 * /car-listings/detay:
 *   get:
 *     summary: İlan numarasına göre ilan detayını getirir
 *     tags: [Car Listings]
 *     parameters:
 *       - in: query
 *         name: ilanNo
 *         required: true
 *         schema:
 *           type: string
 *         description: Detayı getirilecek ilan numarası
 *     responses:
 *       200:
 *         description: İlan detay bilgisi başarıyla döndü
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ilan:
 *                   type: object
 *                   properties:
 *                     ilanNo:
 *                       type: string
 *                     baslik:
 *                       type: string
 *                     brand:
 *                       type: string
 *                     model:
 *                       type: string
 *                     aciklama:
 *                       type: string
 *                     gorseller:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                     user:
 *                       type: object
 *                       properties:
 *                         isim:
 *                           type: string
 *                         soyisim:
 *                           type: string
 *                         telefon:
 *                           type: string
 *                         hesapOlusturmaTarihi:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: İlan numarası (ilanNo) eksik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan numarası (ilanNo) gereklidir.
 *       404:
 *         description: İlan bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bu ilan numarasına ait ilan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan detay bilgisi alınırken bir hata oluştu.
 */
router.get("/detay", getCarListingByIlanNo);

/**
 * @swagger
 * /car-listings/ilan-guncelle:
 *   put:
 *     summary: İlan güncelleme işlemi
 *     tags: [Car Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ilanNo
 *             properties:
 *               ilanNo:
 *                 type: string
 *                 description: Güncellenecek ilan numarası
 *                 example: "123456789"
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               variant1:
 *                 type: string
 *               variant2:
 *                 type: string
 *               variant3:
 *                 type: string
 *               aracYili:
 *                 type: integer
 *               yakit:
 *                 type: string
 *               vites:
 *                 type: string
 *               km:
 *                 type: integer
 *               kasaTipi:
 *                 type: string
 *               garanti:
 *                 type: boolean
 *               agirHasarKaydi:
 *                 type: boolean
 *               takas:
 *                 type: boolean
 *               aciklama:
 *                 type: string
 *               gorseller:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               teknikOzellikler:
 *                 type: object
 *                 properties:
 *                   guvenlik:
 *                     type: object
 *                     additionalProperties:
 *                       type: boolean
 *                   icDonanim:
 *                     type: object
 *                     additionalProperties:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: İlan başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan başarıyla güncellendi.
 *                 ilan:
 *                   type: object
 *                   description: Güncellenmiş ilan nesnesi
 *       400:
 *         description: İlan numarası (ilanNo) eksik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan numarası (ilanNo) zorunludur.
 *       404:
 *         description: İlan bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan güncellenirken bir hata oluştu.
 */
router.put("/ilan-guncelle", authMiddleware(), updateCarListing);

/**
 * @swagger
 * /car-listings/ilan-gorsel-guncelle:
 *   put:
 *     summary: İlan görselini güncelle
 *     tags: [Car Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               yeniGorsel:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Görsel başarıyla güncellendi
 */
router.put(
  "/ilan-gorsel-guncelle",
  upload.single("yeniGorsel"),
  updateCarListingImage
);

/**
 * @swagger
 * /car-listings/ilan-gorsel-guncelle:
 *   put:
 *     summary: İlan görselini güncelle
 *     tags: [Car Listings]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - ilanNo
 *               - eskiGorselUrl
 *               - yeniGorsel
 *             properties:
 *               ilanNo:
 *                 type: string
 *                 description: Güncellenecek ilan numarası
 *                 example: "123456789"
 *               eskiGorselUrl:
 *                 type: string
 *                 description: Değiştirilecek eski görselin URL'si
 *                 example: "https://res.cloudinary.com/demo/image/upload/v123456/oldimage.jpg"
 *               yeniGorsel:
 *                 type: string
 *                 format: binary
 *                 description: Yüklenecek yeni görsel dosyası
 *     responses:
 *       200:
 *         description: Görsel başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel başarıyla güncellendi.
 *                 gorseller:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *       400:
 *         description: Eksik parametreler veya dosya yüklenmemiş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan no ve eski görsel URL zorunludur.
 *       404:
 *         description: İlan veya görsel bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel güncellenemedi.
 */
router.put(
  "/ilan-gorsel-ekle",
  upload.array("yeniGorseller", 10), // max 10 foto
  addImagesToCarListing
);

/**
 * @swagger
 * /car-listings/ilan-gorsel-sirala:
 *   put:
 *     summary: İlan görsellerinin sıralamasını güncelle
 *     tags: [Car Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ilanNo
 *               - yeniSiralama
 *             properties:
 *               ilanNo:
 *                 type: string
 *                 description: Güncellenecek ilan numarası
 *                 example: "123456789"
 *               yeniSiralama:
 *                 type: array
 *                 description: Yeni görsel sıralaması (URL listesi)
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example:
 *                   - "https://res.cloudinary.com/demo/image/upload/v123456/image1.jpg"
 *                   - "https://res.cloudinary.com/demo/image/upload/v123456/image2.jpg"
 *                   - "https://res.cloudinary.com/demo/image/upload/v123456/image3.jpg"
 *     responses:
 *       200:
 *         description: Görsel sıralaması başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel sıralaması başarıyla güncellendi.
 *                 gorseller:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *       400:
 *         description: ilanNo veya yeniSiralama eksik veya hatalı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ilanNo ve yeniSiralama zorunludur.
 *       404:
 *         description: İlan bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel sıralaması güncellenemedi.
 */
router.put("/ilan-gorsel-sirala", authMiddleware(), reorderCarListingImages);

/**
 * @swagger
 * /car-listings/ilan-gorsel-sil:
 *   delete:
 *     summary: İlan görselini sil
 *     tags: [Car Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ilanNo
 *               - gorselUrl
 *             properties:
 *               ilanNo:
 *                 type: string
 *                 description: Silinecek görselin ait olduğu ilan numarası
 *                 example: "123456789"
 *               gorselUrl:
 *                 type: string
 *                 format: uri
 *                 description: Silinecek görselin URL'si
 *                 example: "https://res.cloudinary.com/demo/image/upload/v123456/image1.jpg"
 *     responses:
 *       200:
 *         description: Görsel başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel başarıyla silindi.
 *                 gorseller:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *       400:
 *         description: İlan numarası veya görsel URL eksik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ilanNo ve gorselUrl zorunludur.
 *       404:
 *         description: İlan veya görsel bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Görsel silinirken bir hata oluştu.
 */
router.put("/ilan-gorsel-sil", authMiddleware(), deleteCarListingImage);

/**
 * @swagger
 * /car-listings/ilan-sil:
 *   delete:
 *     summary: İlanı ve tüm görsellerini sil
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ilanNo
 *         required: true
 *         schema:
 *           type: string
 *         description: Silinecek ilan numarası
 *     responses:
 *       200:
 *         description: İlan ve tüm görseller başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan ve tüm görseller başarıyla silindi.
 *       400:
 *         description: ilanNo eksik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ilanNo zorunludur.
 *       404:
 *         description: İlan bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: İlan silinirken bir hata oluştu.
 */
router.delete("/ilan-sil", authMiddleware(), deleteCarListingByIlanNo);

/**
 * @swagger
 * /car-listings/my-listings:
 *   get:
 *     summary: Kullanıcının kendi ilanlarını getirir
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcının ilanları başarıyla getirildi
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
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       model:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           isim:
 *                             type: string
 *                           soyisim:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Yetkilendirme hatası (token geçersiz veya yok)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yetkilendirme hatası
 */
router.get(
  "/my-listings",
  authMiddleware(["bireysel", "kurumsal"]),
  getUserListings
);

/**
 * @swagger
 * /car-listings/my-listings:
 *   get:
 *     summary: Kullanıcının favori ilanlarını getirir
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcının ilanları başarıyla getirildi
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
 *                   description: Kullanıcının ilan sayısı
 *                   example: 3
 *                 listings:
 *                   type: array
 *                   description: Kullanıcının ilanlarının listesi
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: İlanın benzersiz ID'si
 *                         example: "60b8d295bce4db001f59e1e4"
 *                       brand:
 *                         type: string
 *                         description: Araç markası
 *                         example: "Toyota"
 *                       model:
 *                         type: string
 *                         description: Araç modeli
 *                         example: "Corolla"
 *                       user:
 *                         type: object
 *                         properties:
 *                           isim:
 *                             type: string
 *                             description: Kullanıcının ismi
 *                             example: "Ahmet"
 *                           soyisim:
 *                             type: string
 *                             description: Kullanıcının soyismi
 *                             example: "Yılmaz"
 *                           email:
 *                             type: string
 *                             description: Kullanıcının e-posta adresi
 *                             example: "ahmet.yilmaz@example.com"
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
 *         description: Sunucu hatası, ilanlar getirilirken bir hata oluştu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası"
 *                 error:
 *                   type: string
 *                   description: Sunucu hatası detayları
 *                   example: "Database connection failed"
 */
router.get("/favorites", authMiddleware(), getUserFavorites);

/**
 * @swagger
 * /car-listings/renew/{id}:
 *   put:
 *     summary: İlanı yeniden yayına alır ve belirli bir süre için geçerliliğini uzatır
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Yeniden yayına alınacak ilan ID'si
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 description: İlanın geçerlilik süresi (gün olarak)
 *                 example: 7
 *     responses:
 *       200:
 *         description: İlan başarıyla yeniden yayına alındı
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
 *                   example: "İlan başarıyla yeniden yayına alındı."
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: İlanın yeni bitiş tarihi
 *                   example: "2025-12-09T00:00:00Z"
 *       400:
 *         description: Geçersiz gün sayısı (en az 1 gün olmalı)
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
 *                   example: "En az 1 gün seçmelisiniz."
 *       404:
 *         description: İlan bulunamadı
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
router.put("/renew/:id", authMiddleware(), renewListing);

router.get("/arac-degerle", estimateCarValue);

router.get("/:ilanNo/edit",authMiddleware(), getCarListingForUpdate);

module.exports = router;
