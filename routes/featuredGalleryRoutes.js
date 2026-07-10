const express = require("express");
const router = express.Router();
const {
  createFeaturedRequest,
  getAllFeaturedRequests,
  updateFeaturedStatus,
  getActiveFeaturedGalleries,
  checkFeaturedStatus
} = require("../controllers/featuredGalleryController");
const authMiddleware = require("../middleware/authMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");


// Kurumsal
router.post("/request",authMiddleware(["kurumsal"]), createFeaturedRequest);

// Admin
router.get("/admin/featured",authMiddleware(["admin"]),  getAllFeaturedRequests);
router.put("/admin/featured/:id",authMiddleware(["admin"]), updateFeaturedStatus);

// Public
router.get("/featured/active",cacheMiddleware(300), getActiveFeaturedGalleries);

router.get("/check", authMiddleware(["kurumsal"]), checkFeaturedStatus);

module.exports = router;
