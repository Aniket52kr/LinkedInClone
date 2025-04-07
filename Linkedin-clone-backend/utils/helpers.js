const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Optional: Set token expiration
  });
  return token;
};

module.exports = { generateToken };