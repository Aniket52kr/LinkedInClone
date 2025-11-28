const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 
const isLoggedIn = require("../middleware/isLoggedIn");
const { getFeedPosts, createPost, deletePost, getPostById, createComment, likePost, getUserPosts, editPost } = require("../controllers/postcontroller");
const router = express.Router();



// Ensure the 'uploads' directory exists, or create it
const uploadDir = path.join(__dirname, "../uploads"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer with diskStorage to save files temporarily before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});


// Handle multiple files
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 }, // Allow up to 10 files
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only image, video, and PDF are allowed.")); 
    }
    cb(null, true); 
  },
});



// Routes
router.get("/", isLoggedIn, getFeedPosts);
router.post("/create", isLoggedIn, upload.array('files', 10), createPost); 
router.delete("/delete/:id", isLoggedIn, deletePost);
router.get("/:id", isLoggedIn, getPostById);
router.post("/:id/comment", isLoggedIn, createComment);
router.post("/:id/like", isLoggedIn, likePost);
router.get("/user/:userName", isLoggedIn, getUserPosts);
router.put("/edit/:postId", isLoggedIn, upload.array('files', 10), editPost);  


module.exports = router;