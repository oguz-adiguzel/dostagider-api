const express = require("express");
const router = express.Router();
const controller = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware(), controller.createConversation);
router.get("/", authMiddleware(), controller.getMyConversations);
router.get("/:id", authMiddleware(), controller.getConversationById);

module.exports = router;
