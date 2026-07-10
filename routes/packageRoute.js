const express = require("express");
const router = express.Router();
const { createPackage, getPackages,updatePackage, deletePackage } = require("../controllers/packageController");
const authMiddleware = require("../middleware/authMiddleware");


// admin middleware eklemeyi unutma
router.post("/admin/package", createPackage);

router.get("/packages", getPackages);

router.put("/update/:packageId", updatePackage);

router.delete("/delete/:id", deletePackage);



module.exports = router;