const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const { getSuggestedConnections, getPublicProfile, updateProfile, searchUsers } = require("../controllers/usercontrollers");

// Specific routes must come before parameterized routes
router.get("/suggestions", isLoggedIn, getSuggestedConnections);
router.get("/search", isLoggedIn, searchUsers);
router.put("/profile", isLoggedIn, updateProfile);
router.get("/:userName", isLoggedIn, getPublicProfile);

module.exports = router;