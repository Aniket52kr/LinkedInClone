const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const {getUserNotification, markNotificationRead, deleteNotification, markAllNotificationsRead} = require("../controllers/notificationcontrollers");
const router = express.Router();

router.get("/", isLoggedIn, getUserNotification)
router.put("/:id/read", isLoggedIn, markNotificationRead)
router.delete("/:id", isLoggedIn, deleteNotification)
router.put("/mark-all-read", isLoggedIn, markAllNotificationsRead);
module.exports = router;