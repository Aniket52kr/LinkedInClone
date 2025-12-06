// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { register, login, logout, getCurrentUser } = require('../controllers/authControllers');

const isLoggedIn = require('../middleware/isLoggedIn');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', isLoggedIn, getCurrentUser);

module.exports = router;