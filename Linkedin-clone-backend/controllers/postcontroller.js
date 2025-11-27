const { sendCommentNotificationEmail } = require("../emails/emailHandlers");
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





// edit post route:-
const editPost = async (req, res) => {
  try {
    const { content, imagesToAdd, imagesToRemove, newVideo, newDocument } = req.body;
    const postId = req.params.id;

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
      for (const publicId of imagesToRemove) {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId);
        // Remove from post
        post.images = post.images.filter(img => img.publicId !== publicId);
      }
    }

    // Handle new image additions
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mimetype.startsWith("image")) {
          const fileResult = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
          });
          post.images.push({
            url: fileResult.secure_url,
            publicId: fileResult.public_id,
          });
        }
        // Clean up temporary file
        const fs = require("fs");
        fs.unlinkSync(file.path);
      }
    }

    // Handle video replacement
    if (newVideo && req.files) {
      const videoFile = req.files.find(file => file.mimetype.startsWith("video"));
      if (videoFile) {
        // Delete old video if exists
        if (post.videoPublicId) {
          await cloudinary.uploader.destroy(post.videoPublicId, { resource_type: "video" });
        }
        // Upload new video
        const videoResult = await cloudinary.uploader.upload(videoFile.path, {
          folder: "posts",
          resource_type: "video",
        });
        post.videoUrl = videoResult.secure_url;
        post.videoPublicId = videoResult.public_id;
        // Clean up temporary file
        const fs = require("fs");
        fs.unlinkSync(videoFile.path);
      }
    }

    // Handle document replacement
    if (newDocument && req.files) {
      const docFile = req.files.find(file => file.mimetype === "application/pdf");
      if (docFile) {
        // Delete old document if exists
        if (post.documentPublicId) {
          await cloudinary.uploader.destroy(post.documentPublicId, { resource_type: "raw" });
        }
        // Upload new document
        const docResult = await cloudinary.uploader.upload(docFile.path, {
          folder: "posts",
          resource_type: "raw",
        });
        post.documentUrl = docResult.secure_url;
        post.documentPublicId = docResult.public_id;
        // Clean up temporary file
        const fs = require("fs");
        fs.unlinkSync(docFile.path);
      }
    }

    // Mark as edited
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    // Populate author details
    await post.populate("author", "firstName userName profilePicture headline");

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