const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const { getSuggestedConnections, getPublicProfile, updateProfile, searchUsers, trackProfileView } = require("../controllers/usercontrollers");

// Specific routes must come before parameterized routes
router.get("/suggestions", isLoggedIn, getSuggestedConnections);
router.get("/search", isLoggedIn, searchUsers);
router.put("/profile", isLoggedIn, updateProfile);
router.get("/:userName", isLoggedIn, getPublicProfile);
router.post("/track-profile-view/:userId", isLoggedIn, trackProfileView);

module.exports = router;