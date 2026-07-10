const express = require("express");
const router = express.Router();
const controller = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware(), controller.sendMessage);
router.get("/:conversationId", authMiddleware(), controller.getMessages);
router.patch("/:conversationId/read", authMiddleware(), controller.markAsRead);

module.exports = router;
