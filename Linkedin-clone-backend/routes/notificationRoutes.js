const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const {getUserNotification, markNotificationRead, deleteNotification} = require("../controllers/notificationcontrollers");
const router = express.Router();

router.get("/", isLoggedIn, getUserNotification)
router.put("/:id/read", isLoggedIn, markNotificationRead)
router.delete("/:id", isLoggedIn, deleteNotification)

module.exports = router;