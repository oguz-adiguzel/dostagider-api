const express = require("express");
const router = express.Router();

const {
  createListingReport,
  getListingReports,
  reviewListingReport,
  warnListingOwner
} = require("../controllers/reportListingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware([]), createListingReport);
router.get(
  "/list",
  authMiddleware(['admin']),
  getListingReports
);

router.delete(
  "/review/:reportId",
  authMiddleware(['admin']),
  reviewListingReport
);

router.post(
  "/warn-owner/:reportId",
  authMiddleware(['admin']),
  warnListingOwner
);

module.exports = router;
