const express = require("express");
const app = express();
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const path = require("path");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");
dotenv.config();

// Load environment vars
const isProduction = process.env.NODE_ENV === "production";

// Allowed CORS Origins
const allowedOrigins = [
  "https://linkedin-clone-hqh8.onrender.com",
  process.env.CLIENT_URL,
  "http://localhost:5173",
];

// CORS Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parser + Security Headers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Parse Cookies
app.use(cookieParser());

// Debug Incoming Cookies
app.use((req, res, next) => {
  console.log("Incoming Cookies:", req.cookies);
  next();
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Failed:", err));

// Session Setup
app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Routes
const authRoutes = require("./controllers/authcontrollers");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const connectionRoutes = require("./routes/connectionRoutes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/notifications", notificationRoutes);
app.use("/connections", connectionRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).send("LinkedIn clone backend is running...");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



















// const express = require("express");
// const app = express();
// const expressSession = require("express-session");
// const cookieParser = require("cookie-parser");
// const mongoose = require("mongoose");
// const helmet = require("helmet");
// const path = require("path");
// const cors = require("cors");
// const MongoStore = require("connect-mongo");
// const dotenv = require("dotenv");
// dotenv.config();

// // Routes
// const authRoutes = require("./controllers/authcontrollers");
// const userRoutes = require("./routes/userRoutes");
// const postRoutes = require("./routes/postRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const connectionRoutes = require("./routes/connectionRoutes");

// // CORS Middleware
// const allowedOrigins = [
//   "https://linkedin-clone-hqh8.onrender.com",
//   process.env.CLIENT_URL,
//   "http://localhost:5173",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Middlewares
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(helmet());
// app.use(cookieParser());

// // Database Connection
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB Connection Failed:", err));

// // Session and Cookie Setup
// app.use(
//   expressSession({
//     secret: process.env.EXPRESS_SESSION_SECRET || "secret_key",
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // true on Render
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     },
//   })
// );

// // Routes
// app.use("/auth", authRoutes);
// app.use("/users", userRoutes);
// app.use("/posts", postRoutes);
// app.use("/notifications", notificationRoutes);
// app.use("/connections", connectionRoutes);

// // Root route for health check
// app.get("/", (req, res) => {
//   res.status(200).send("LinkedIn clone backend is running...");
// });

// // Error Handling
// app.use((err, req, res, next) => {
//   console.error("Unhandled Error:", err);
//   res.status(500).json({ message: "Something went wrong!" });
// });

// // Server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
