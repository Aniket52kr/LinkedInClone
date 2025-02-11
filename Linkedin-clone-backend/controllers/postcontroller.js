const { sendCommentNotificationEmail } = require("../emails/emailHandlers");
const { cloudinary } = require("../lib/cloudinary");
const Post = require("../models/posts");
const Notification = require("../models/notifications");


// get feed post route:-
const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      author: { $in: [...req.user.connections, req.user._id] },
    })
      .populate("author", "firstName userName profilePicture headline")
      .populate("comments.user", "firstName profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// create post route:-
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let fileUrl = null;
    let fileType = null;
    let filePublicId = null;

    // Ensure file is received
    if (req.file) {
      let fileResult;

      // Handle file uploads (image, video, pdf)
      if (req.file.mimetype.startsWith("image")) {
        fileResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "posts",
        });
        fileType = "image";
      } else if (req.file.mimetype.startsWith("video")) {
        fileResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "posts",
          resource_type: "video",
        });
        fileType = "video";
      } else if (req.file.mimetype === "application/pdf") {
        fileResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "posts",
          resource_type: "raw",
        });
        fileType = "pdf";
      }

      if (fileResult) {
        fileUrl = fileResult.secure_url;
        filePublicId = fileResult.public_id;
      }
    }

    // Save post with content and fileUrl
    const newPost = new Post({
      author: req.user._id,
      content,
      fileUrl,  
      fileType, 
      filePublicId, 
    });

    await newPost.save();
    console.log("New Post:", newPost); 
    res.status(201).json(newPost);  
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// delete post route:-
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // Delete file from Cloudinary if file exists
    if (post.filePublicId) {
      const resourceType = post.fileType === "video" ? "video" : post.fileType === "pdf" ? "raw" : "image";
      await cloudinary.uploader.destroy(post.filePublicId, { resource_type: resourceType });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// get post route:-
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "firstName userName profilePicture headline")
      .populate("comments.user", "firstName profilePicture userName headline");
    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// create comment route:-
const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, content } } },
      { new: true }
    ).populate("author", "firstName email userName profilePicture headline");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create a notification if the comment owner is not the post owner
    if (post.author._id.toString() !== req.user._id.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: "comment",
        relatedUser: req.user._id,
        relatedPost: req.params.id,
      });
      await newNotification.save();

      // Send email notification to the post owner when a new comment is made
      try {
        const postUrl = `${process.env.CLIENT_URL}/post/${req.params.id}`;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.firstName,
          req.user.firstName,
          postUrl,
          content
        );
      } catch (error) {
        console.error("Error sending comment notification email:", error);
      }
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// like post route:-
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(req.user._id)) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);

      // Create a notification if the post owner is not the liker
      if (post.author.toString() !== req.user._id.toString()) {
        const newNotification = new Notification({
          recipient: post.author,
          type: "like",
          relatedUser: req.user._id,
          relatedPost: req.params.id,
        });

        await newNotification.save();
      }
    }

    await post.save();
    res.status(200).json({ post });
  } catch (error) {
    console.error("Error liking or unliking post:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


module.exports = {
  getFeedPosts,
  createPost,
  deletePost,
  getPostById,
  createComment,
  likePost,
};
