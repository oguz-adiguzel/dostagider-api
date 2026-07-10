const express = require("express");
const router = express.Router();
const {
  createCarOption,
  getAllCarOptions,
  getAllCategories,
  getFilteredCarOptions,
  createCategory,
  listingPageGetFilteredCarOptions
} = require("../controllers/carOptionController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Car Options
 *   description: Araç opsiyonları işlemleri
 */


/**
 * @swagger
 * /car-options/:
 *   post:
 *     summary: Yeni araç opsiyonu oluştur
 *     tags: [Car Options]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionName:
 *                 type: string
 *                 example: "Sunroof"
 *               category:
 *                 type: string
 *                 example: "Exterior"
 *     responses:
 *       201:
 *         description: Opsiyon başarıyla oluşturuldu
 */
router.post("/", createCarOption);

/**
 * @swagger
 * /car-options/all:
 *   get:
 *     summary: Tüm araç opsiyonlarını getir
 *     tags: [Car Options]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Opsiyonlar listelendi
 */
router.get("/all",authMiddleware(), getAllCarOptions);

/**
 * @swagger
 * /car-options/categories:
 *   get:
 *     summary: Tüm kategori listesini getir
 *     tags: [Car Options]
 *     responses:
 *       200:
 *         description: Kategori listesi döndü
 */
router.get("/categories", getAllCategories);

/**
 * @swagger
 * /car-options/filter:
 *   get:
 *     summary: Filtrelenmiş araç opsiyonlarını getir
 *     tags: [Car Options]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrelemek için kategori ismi
 *     responses:
 *       200:
 *         description: Filtrelenmiş opsiyonlar listelendi
 */
router.get("/filter", getFilteredCarOptions);

router.get("/listing-page-filter", listingPageGetFilteredCarOptions);


/**
 * @swagger
 * /car-options/categories:
 *   post:
 *     summary: Kategori oluştur
 *     tags: [Car Options]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrelemek için kategori ismi
 *     responses:
 *       200:
 *         description: Filtrelenmiş opsiyonlar listelendi
 */
router.post("/categories",authMiddleware("admin"), createCategory);

module.exports = router;
