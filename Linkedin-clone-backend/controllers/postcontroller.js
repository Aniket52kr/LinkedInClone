const { sendCommentNotificationEmail, sendLikeNotificationEmail } = require("../emails/emailHandlers");
const { cloudinary } = require("../lib/cloudinary");
const Post = require("../models/post");
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
        await Notification.create ({
          recipient: post.author._id,
          type: "like",
          relatedUser: userId,
          relatedPost: post._id
        });
      } catch (error) {
        consoe.error("Error creating like notification", error);
      }


      const postUrl = `${process.env.CLIENT_URL}/post/${id}`;
      const recipientEmail = post.author.email;
      const recipientName = post.author.firstName;
      const likerName = req.user.firstName;
      const postContent = post.content;

      setImmediate(() => {
        sendLikeNotificationEmail(
          recipientEmail,
          recipientName,
          likerName,
          postUrl,
          postContent
        ).catch((error) => {
          console.error("Error sending like notification email:", error);
        });
      });
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
    console.log("Backend: Fetching posts for userName:", userName);

    // find user by username
    const user = await User.findOne({ userName });
    
    if (!user) {
      console.log("Backend: User not found:", userName);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Backend: User found:", user._id);

    // Use 'author' field to match Post model
    const posts = await Post.find({ author: user._id })
      .populate("author", "firstName lastName userName profilePicture headline")
      .populate("comments.user", "firstName profilePicture")
      .sort({ createdAt: -1 });

    console.log("Backend: Posts found:", posts.length);
    console.log("Backend: First post structure:", posts[0]);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts: ", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




// edit post route
const editPost = async (req, res) => {
  try {
    console.log("Edit post request body:", req.body);
    console.log("Edit post files:", req.files);
    
    const { content } = req.body;
    const postId = req.params.postId;
    
    // Parse files to remove (handle both old and new formats)
    const filesToRemove = req.body.filesToRemove ? JSON.parse(req.body.filesToRemove) : 
                         req.body.imagesToRemove ? JSON.parse(req.body.imagesToRemove) : [];

    console.log("Parsed filesToRemove:", filesToRemove);

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

    // Handle file removals (images, videos, documents)
    if (filesToRemove && filesToRemove.length > 0) {
      console.log("Removing files:", filesToRemove);
      for (const fileToRemove of filesToRemove) {
        try {
          const { type, publicId } = fileToRemove;
          
          // Delete from Cloudinary
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log("Deleted from Cloudinary:", publicId);
          }
          
          // Remove from post based on type
          if (type === 'image') {
            post.images = post.images.filter(img => img.publicId !== publicId);
          } else if (type === 'video') {
            post.videoUrl = null;
            post.videoPublicId = null;
          } else if (type === 'document') {
            post.documentUrl = null;
            post.documentPublicId = null;
          }
          
        } catch (error) {
          console.error("Failed to delete file:", fileToRemove, error);
        }
      }
    }

    // Handle new file additions
    if (req.files && req.files.length > 0) {
      console.log("Processing new files:", req.files.length);
      
      for (const file of req.files) {
        try {
          if (file.mimetype.startsWith("image/")) {
            // Handle images
            const fileResult = await cloudinary.uploader.upload(file.path, {
              folder: "linkedin/posts",
              resource_type: "image"
            });
            post.images.push({
              url: fileResult.secure_url,
              publicId: fileResult.public_id,
            });
            console.log("Uploaded new image:", fileResult.public_id);
            
          } else if (file.mimetype.startsWith("video/")) {
            // Handle videos
            const fileResult = await cloudinary.uploader.upload(file.path, {
              folder: "linkedin/posts",
              resource_type: "video"
            });
            post.videoUrl = fileResult.secure_url;
            post.videoPublicId = fileResult.public_id;
            console.log("Uploaded new video:", fileResult.public_id);
            
          } else if (file.mimetype.includes("document") || file.mimetype === "application/pdf") {
            // Handle documents
            const fileResult = await cloudinary.uploader.upload(file.path, {
              folder: "linkedin/posts",
              resource_type: "auto"
            });
            post.documentUrl = fileResult.secure_url;
            post.documentPublicId = fileResult.public_id;
            console.log("Uploaded new document:", fileResult.public_id);
          }
        } catch (error) {
          console.error("Failed to upload file:", file.originalname, error);
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

    console.log("Final post after edit:", {
      images: post.images.length,
      video: !!post.videoUrl,
      document: !!post.documentUrl
    });
    
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