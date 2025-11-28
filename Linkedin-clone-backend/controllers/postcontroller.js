const { sendCommentNotificationEmail, sendLikeNotificationEmail } = require("../emails/emailHandlers");
const { cloudinary } = require("../lib/cloudinary");
const Post = require("../models/posts");
const Notification = require("../models/notifications");
const User = require("../models/user");


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
    let images = [];
    let videoUrl = null;
    let videoPublicId = null;
    let documentUrl = null;
    let documentPublicId = null;

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileResult;

        if (file.mimetype.startsWith("image")) {
          fileResult = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
          });
          images.push({
            url: fileResult.secure_url,
            publicId: fileResult.public_id,
          });
        } else if (file.mimetype.startsWith("video")) {
          fileResult = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
            resource_type: "video",
          });
          videoUrl = fileResult.secure_url;
          videoPublicId = fileResult.public_id;
        } else if (file.mimetype === "application/pdf") {
          fileResult = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
            resource_type: "raw",
          });
          documentUrl = fileResult.secure_url;
          documentPublicId = fileResult.public_id;
        }

        // Clean up temporary file
        const fs = require("fs");
        fs.unlinkSync(file.path);
      }
    }

    // Create new post
    const newPost = new Post({
      content,
      author: req.user._id,
      images,
      videoUrl,
      videoPublicId,
      documentUrl,
      documentPublicId,
    });

    await newPost.save();

    // Populate author details
    await newPost.populate("author", "firstName userName profilePicture headline");

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
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id).populate("author", "firstName email userName");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    // Add like
    post.likes.push(userId);
    await post.save();

    // Send email notification to post author (if not liking own post)
    if (post.author._id.toString() !== userId.toString()) {
      try {
        const postUrl = `${process.env.CLIENT_URL}/post/${id}`;
        await sendLikeNotificationEmail(
          post.author.email,
          post.author.firstName,
          req.user.firstName,
          postUrl,
          post.content
        );
      } catch (error) {
        console.error("Error sending like notification email:", error);
      }
    }

    res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Server error" });
  }
};





// get users posts
const getUserPosts = async (req, res) => {
  try {
    const { userName } = req.params;

    // find user by username
    // const User = require("../models/user");
    const user = await User.findOne({ userName });

    if(!user) {
      return res.status(404).json({ message: "User not found" });
    };

    const posts = await Post.find({ author: user._id })
      .populate("author", "firstName userName profilePicture headline", )
      .populate("comments.user", "firstName profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts: ", error);
    res.status(500).json({ message: "server Error", error: error.message });
  }
};





// edit post route
const editPost = async (req, res) => {
  try {
    console.log("Edit post request body:", req.body);
    console.log("Edit post files:", req.files);
    
    const { content } = req.body;
    const postId = req.params.postId; // Fix: should be postId not id
    const imagesToRemove = req.body.imagesToRemove ? JSON.parse(req.body.imagesToRemove) : [];

    console.log("Parsed imagesToRemove:", imagesToRemove);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this post" });
    }

    // Update content
    if (content !== undefined) {
      post.content = content;
    }

    // Handle image removals
    if (imagesToRemove && imagesToRemove.length > 0) {
      console.log("Removing images:", imagesToRemove);
      for (const publicId of imagesToRemove) {
        try {
          // Delete from Cloudinary
          await cloudinary.uploader.destroy(publicId);
          console.log("Deleted from Cloudinary:", publicId);
          // Remove from post
          post.images = post.images.filter(img => img.publicId !== publicId);
        } catch (error) {
          console.error("Failed to delete image from Cloudinary:", publicId, error);
        }
      }
    }

    // Handle new image additions
    if (req.files && req.files.length > 0) {
      console.log("Processing new files:", req.files.length);
      for (const file of req.files) {
        if (file.mimetype.startsWith("image/")) {
          try {
            const fileResult = await cloudinary.uploader.upload(file.path, {
              folder: "linkedin/posts", // Use consistent folder name
            });
            post.images.push({
              url: fileResult.secure_url,
              publicId: fileResult.public_id,
            });
            console.log("Uploaded new image:", fileResult.public_id);
          } catch (error) {
            console.error("Failed to upload image:", error);
          }
        }
        // Clean up temporary file
        try {
          const fs = require("fs");
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error("Failed to delete temp file:", error);
        }
      }
    }

    // Mark as edited
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    // Populate author details
    await post.populate("author", "firstName userName profilePicture headline");

    console.log("Final post after edit:", post.images.length, "images");
    res.status(200).json(post);
  } catch (error) {
    console.error("Error editing post:", error);
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
  getUserPosts,
  editPost,
};