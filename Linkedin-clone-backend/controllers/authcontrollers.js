// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const User = require("../models/user");
// const { generateToken } = require("../utils/helpers");
// const { sendWelcomeEmail } = require("../emails/emailHandlers");
// const isLoggedIn = require("../middleware/isLoggedIn");


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

//     let token = generateToken(newUser);
//     res.cookie("token", token, {
//       httpOnly: true,
//       maxAge: 3 * 60 * 60 * 24 * 1000,
//       sameSite: "strict",
//       secure: process.env.NODE_ENV === "development",
//     });
//     res.status(201).json({
//       message: "User registered successfully",
//       user: newUser,
//       token: token,
//     });

//     const profileUrl = process.env.CLIENT_URL + "/profile/" + newUser.firstName;
//     try {
//       await sendWelcomeEmail(
//         newUser.email,
//         newUser.firstName,
//         newUser.lastName,
//         profileUrl
//       );
//     } catch (error) {
//       console.log("Error sending welcome email", error);
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
//         let token = generateToken(user);
//         res.cookie("token", token, {
//           httpOnly: true,
//           maxAge: 3 * 60 * 60 * 24 * 1000,
//           sameSite: "strict",
//           secure: true,
//         });
//         res
//           .status(200)
//           .json({ message: "User logged in successfully", user, token });
//       } else {
//         res.status(401).json({ message: "Invalid credentials" });
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// // logout route:-
// router.post("/logout", (req, res) => {
//   res.cookie("token", "");
//   res.status(200).json({ message: "User logged out successfully" });
// });


// // me route:-                                                                                                                                                                                                                                                                       
// router.get("/me", isLoggedIn, async (req, res) => {
//   try {
//     res.json(req.user);
//   } catch (error) {
//     console.log("Error in getCurrentUser controller:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


























const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateToken } = require("../utils/helpers");
const { sendWelcomeEmail } = require("../emails/emailHandlers");
const isLoggedIn = require("../middleware/isLoggedIn");

// Registration Route
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashedPassword,
    });

    // Save user to session
    req.session.user = {
      id: newUser._id,
      email: newUser.email,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session after register:", err);
      }
    });

    // Optional: Also generate JWT
    let token = generateToken(newUser);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token: token,
    });

    const profileUrl = process.env.CLIENT_URL + "/profile/" + newUser.firstName;
    await sendWelcomeEmail(
      newUser.email,
      newUser.firstName,
      newUser.lastName,
      profileUrl
    );

  } catch (err) {
    console.error("Registration error:", err);
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

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Save user to session
    req.session.user = {
      id: user._id,
      email: user.email,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session after login:", err);
      }
    });

    let token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "User logged in successfully", user, token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("token");
    res.status(200).json({ message: "User logged out successfully" });
  });
});

// Me Route
router.get("/me", isLoggedIn, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
