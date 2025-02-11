const jwt = require("jsonwebtoken");
const User = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();


module.exports = async function (req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "You need to login first" });
  }

  try {
    let decoded = jwt.verify(token, process.env.JWT_KEY);
    let user = await User.findOne({ email: decoded.email }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error verifying token:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please log in again." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token. Please log in again." });
    } else {
    res.status(500).json({ message: "Something went wrong. Please try again." });    
    }

  }
};