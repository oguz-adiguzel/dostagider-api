const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addNotification,
  getNotifications,
  readNotification,
  allNotificationDelete,
  deleteNotification
} = require("../controllers/notificationController");

router.post("/admin-notification", authMiddleware(['admin']), addNotification);

router.get("/user-notification", authMiddleware([]), getNotifications);

router.put("/:id/read", authMiddleware([]), readNotification)

router.delete('/delete-all', authMiddleware([]), allNotificationDelete)

router.delete(
  "/delete/:id",
  authMiddleware([]),
  deleteNotification
);

module.exports = router;
