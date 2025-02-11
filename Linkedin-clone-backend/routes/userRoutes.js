const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const { getSuggestedConnections, getPublicProfile, updateProfile } = require("../controllers/usercontrollers");

router.get("/suggestions", isLoggedIn, getSuggestedConnections);
router.get("/:userName", isLoggedIn, getPublicProfile);
router.put("/profile", isLoggedIn, updateProfile)

module.exports = router;