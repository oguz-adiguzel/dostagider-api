const express = require("express");
const router = express.Router();
const { getCorporateUserDetails, addTeam, getCorporateTeam, deleteTeamMember, payment } = require("../controllers/corporateController");
const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Corporate
 *   description: Kurumsal kullanıcı işlemleri
 */

/**
 * @swagger
 * /corporate/{slug}:
 *   get:
 *     summary: Kurumsal kullanıcı detaylarını getir
 *     tags: [Corporate]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Kurumsal kullanıcının benzersiz kimliği (slug)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "ABC Kurumsal"
 *                 email:
 *                   type: string
 *                   example: "abc@corporate.com"
 *                 address:
 *                   type: string
 *                   example: "Adres örneği"
 *       404:
 *         description: Kullanıcı bulunamadı
 */

router.get("/:slug", getCorporateUserDetails);


/**
 * @swagger
 * /corporate/{slug}/ekip:
 *   post:
 *     summary: Kurumsal kullanıcı için yeni ekip üyesi ekle
 *     tags: [Corporate]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Kurumsal kullanıcının benzersiz kimliği (slug)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Ekip üyesinin fotoğrafı
 *               teamMemberName:
 *                 type: string
 *                 example: "John Doe"
 *               position:
 *                 type: string
 *                 example: "Software Engineer"
 *     responses:
 *       201:
 *         description: Ekip üyesi başarıyla eklendi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/:slug/ekip",authMiddleware(["kurumsal"]), upload.single("foto"), addTeam);


/**
 * @swagger
 * /corporate/{slug}/ekip:
 *   get:
 *     summary: Kurumsal kullanıcı ekibinin listesini getir
 *     tags: [Corporate]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Kurumsal kullanıcının benzersiz kimliği (slug)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kurumsal kullanıcının ekip üyeleri başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   position:
 *                     type: string
 *                     example: "Software Engineer"
 *                   photoUrl:
 *                     type: string
 *                     example: "http://example.com/johndoe.jpg"
 *       404:
 *         description: Ekip üyeleri bulunamadı
 */
router.get("/:slug/ekip",authMiddleware(["kurumsal"]), getCorporateTeam);


/**
 * @swagger
 * /corporate/{slug}/ekip/{memberId}:
 *   post:
 *     summary: Kurumsal kullanıcı seçilen ekip üyesini sil
 *     tags: [Corporate]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Kurumsal kullanıcının benzersiz kimliği (slug)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Ekip üyesinin fotoğrafı
 *               teamMemberName:
 *                 type: string
 *                 example: "John Doe"
 *               position:
 *                 type: string
 *                 example: "Software Engineer"
 *     responses:
 *       201:
 *         description: Ekip üyesi başarıyla eklendi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.delete("/:slug/ekip/:memberId", deleteTeamMember);

router.put("/payment", payment)

module.exports = router;
