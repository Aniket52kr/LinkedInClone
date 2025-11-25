const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const isLoggedIn = require("../middleware/isLoggedIn");



// Send message with file upload (images, documents)
router.post("/send-file", isLoggedIn, messageController.upload.single('file'), messageController.sendMessageWithFile);

// Send text message
router.post("/send", isLoggedIn, messageController.sendMessage);

// Get all conversations for the current user
router.get("/conversations", isLoggedIn, messageController.getConversations);

// Get messages between current user and another user
router.get("/messages/:userId", isLoggedIn, messageController.getMessages);

// Delete a message
router.delete("/:messageId", isLoggedIn, messageController.deleteMessage);

// Mark messages as read
router.post("/read/:userId", isLoggedIn, messageController.markAsRead);

module.exports = router;