const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateToken } = require("../utils/helpers");
const { sendWelcomeEmail } = require("../emails/emailHandlers");
const isLoggedIn = require("../middleware/isLoggedIn");

const isProduction = process.env.NODE_ENV === "production";

// Register Route
router.post("/register", async (req, res) => {
  const { firstName, lastName, userName, email, password } = req.body;

  if (!firstName || !userName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });

    console.log("Cookie set on registration:", token);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
    });

    const profileUrl = `${process.env.CLIENT_URL}/profile/${newUser.firstName}`;
    try {
      await sendWelcomeEmail(
        newUser.email,
        newUser.firstName,
        newUser.lastName,
        profileUrl
      );
    } catch (emailErr) {
      console.error("Error sending welcome email:", emailErr);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = generateToken(user);

        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 3 * 24 * 60 * 60 * 1000,
          sameSite: "None",
          secure: true,
        });

        console.log("Cookie set on login:", token);

        res.status(200).json({
          message: "User logged in successfully",
          user,
          token,
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "None",
    secure: true,
  });

  console.log("Cookie cleared on logout");

  res.status(200).json({ message: "User logged out successfully" });
});

// Me Route
router.get("/me", isLoggedIn, async (req, res) => {
  try {
    console.log("Cookies received in /me:", req.cookies);
    res.json(req.user);
  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
























// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const User = require("../models/user");
// const { generateToken } = require("../utils/helpers");
// const { sendWelcomeEmail } = require("../emails/emailHandlers");
// const isLoggedIn = require("../middleware/isLoggedIn");

// // Helper to determine if secure cookie should be used
// const isProduction = process.env.NODE_ENV === "production";

// // Registration Route
// router.post("/register", async (req, res) => {
//   const { firstName, lastName, userName, email, password } = req.body;

//   if (!firstName || !userName || !email || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = await User.create({
//       firstName,
//       lastName,
//       userName,
//       email,
//       password: hashedPassword,
//     });

//     const token = generateToken(newUser);
//     res.cookie("token", token, {
//       httpOnly: true,
//       maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
//       sameSite: "strict",
//       secure: isProduction,
//     });

//     res.status(201).json({
//       message: "User registered successfully",
//       user: newUser,
//       token,
//     });

//     // Send welcome email
//     const profileUrl = ${process.env.CLIENT_URL}/profile/${newUser.firstName};
//     try {
//       await sendWelcomeEmail(
//         newUser.email,
//         newUser.firstName,
//         newUser.lastName,
//         profileUrl
//       );
//     } catch (emailErr) {
//       console.error("Error sending welcome email:", emailErr);
//     }
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Login Route
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     bcrypt.compare(password, user.password, (err, result) => {
//       if (result) {
//         const token = generateToken(user);
//         res.cookie("token", token, {
//           httpOnly: true,
//           maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
//           sameSite: "strict",
//           secure: isProduction,
//         });

//         res.status(200).json({
//           message: "User logged in successfully",
//           user,
//           token,
//         });
//       } else {
//         res.status(401).json({ message: "Invalid credentials" });
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Logout Route
// router.post("/logout", (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//     sameSite: "strict",
//     secure: isProduction,
//   });
//   res.status(200).json({ message: "User logged out successfully" });
// });

// // Me Route (Current User Info)
// router.get("/me", isLoggedIn, async (req, res) => {
//   try {
//     res.json(req.user);
//   } catch (error) {
//     console.error("Error in /me route:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;  
