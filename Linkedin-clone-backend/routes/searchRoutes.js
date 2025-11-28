const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const { advancedSearch, getSearchSuggestions } = require("../controllers/searchController");



router.get("/", isLoggedIn, advancedSearch);
router.get("/suggestions", isLoggedIn, getSearchSuggestions);


module.exports = router;