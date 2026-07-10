const express = require("express");
const router = express.Router();
const {
  createBrandPriceList,
  addModelToBrand,
  addPackageToModel,
  updatePackagePrice,
  deletePackage,
  getAllBrandPriceLists,
  markBrandChecked,
  deleteBrandModel,
  deleteModelPackage
} = require("../controllers/brandPriceListController");

// Multer (tek dosya upload)
const upload = require("../middleware/multer");

// Auth / Role middleware (varsayılan)
// const authMiddleware = require("../middlewares/authMiddleware");
// const adminMiddleware = require("../middlewares/adminMiddleware");


router.post(
  "/",
 
  upload.single("logo"),
  createBrandPriceList
);

router.post(
  "/:brandSlug/models",
  upload.single("photo"),
  addModelToBrand
);

router.post(
  "/:brandSlug/models/:modelSlug/packages",
  addPackageToModel
)

router.put(
  "/:brandSlug/models/:modelSlug/packages/:packageName",
  updatePackagePrice
);

router.delete(
  "/:brandSlug/models/:modelSlug/packages",
  // authMiddleware,
  // adminMiddleware,
  deletePackage
);

router.get("/", getAllBrandPriceLists);

router.patch(
  "/:brandSlug/mark-checked",
  markBrandChecked
);

router.delete(
  "/:brandId/model/:modelName",
  deleteBrandModel
);

router.delete(
  "/:brandId/model/:modelName/package/:packageName",
  deleteModelPackage
);

module.exports = router;
