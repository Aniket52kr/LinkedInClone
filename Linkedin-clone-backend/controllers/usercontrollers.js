const mongoose = require("mongoose");
const User = require("../models/user");
const { cloudinary } = require("../lib/cloudinary");
const { sendProfileViewEmail } = require("../emails/emailHandlers");
const Notification = require("../models/notifications");


const getSuggestedConnections = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select("connections skills experience education location");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get users who are not already connected and not the current user
    const suggestedUsers = await User.find({
      _id: { 
        $nin: [
          ...(currentUser.connections || []), 
          req.user._id
        ] 
      },
    })
      .select("userName firstName lastName profilePicture headline connections skills experience education location")
      .limit(12) // Show more suggestions
      .sort({ createdAt: -1 }); // Show newer users first

    res.json(suggestedUsers);
  } catch (error) {
    console.error("Error fetching suggested connections:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



const getPublicProfile = async (req, res) => {
  try {
    console.log(`Fetching profile for userName: ${req.params.userName}`);

    const user = await User.findOne({ userName: req.params.userName }).select(
      "firstName lastName userName profilePicture bannerImg headline about location experience education skills connections"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Public Profile Data:", user);
    res.json(user);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




const updateProfile = async (req, res) => {
  try {
    console.log("Received update profile request:", req.body);

    const allowedFields = [
      "firstName",
      "lastName",
      "userName",
      "headline",
      "about",
      "location",
      "skills",
      "experience",
      "education",
    ];

    const updatedData = {};
    allowedFields.forEach(field => {
      if (req.body[field]) {
        updatedData[field] = req.body[field];
      }
    });

    // Ensure valid `_id` values in experience and education
    if (req.body.experience) {
      updatedData.experience = req.body.experience.map(exp => ({
        ...exp,
        _id: mongoose.Types.ObjectId.isValid(exp._id?.toString()) ? exp._id : new mongoose.Types.ObjectId(),
      }));
    }
    
    if (req.body.education) {
      updatedData.education = req.body.education.map(edu => ({
        ...edu,
        _id: mongoose.Types.ObjectId.isValid(edu._id?.toString()) ? edu._id : new mongoose.Types.ObjectId(),
      }));
    }
    

    // Fetch the user before updating (to delete old images)
    const existingUser = await User.findById(req.user._id);

    // Handle profile picture upload
    if (req.body.profilePicture && req.body.profilePicture.startsWith("data:image")) {
      try {
        console.log("Uploading profile picture to Cloudinary...");

        // Delete old profile picture from Cloudinary (if it exists)
        if (existingUser.profilePicture) {
          const publicId = existingUser.profilePicture.split("/").slice(-2).join("/").split(".")[0]; // Extract folder and publicId
          await cloudinary.uploader.destroy(publicId);
        }

        const result = await cloudinary.uploader.upload(req.body.profilePicture, {
          folder: "profile_pictures", // Store in "profile_pictures" folder
        });

        console.log("Cloudinary upload success:", result);
        updatedData.profilePicture = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Image upload failed", error: error.message });
      }
    }

    // Handle banner image upload
    if (req.body.bannerImg && req.body.bannerImg.startsWith("data:image")) {
      try {
        console.log("Uploading banner image to Cloudinary...");

        // Delete old banner image from Cloudinary (if it exists)
        if (existingUser.bannerImg) {
          const publicId = existingUser.bannerImg.split("/").slice(-2).join("/").split(".")[0]; // Extract folder and publicId
          await cloudinary.uploader.destroy(publicId);
        }

        const result = await cloudinary.uploader.upload(req.body.bannerImg, {
          folder: "banners", // Store in "banners" folder
        });

        console.log("Cloudinary upload success:", result);
        updatedData.bannerImg = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Banner image upload failed", error: error.message });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true }
    ).select("firstName lastName userName profilePicture bannerImg headline about location experience education skills connections");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Updated User Profile:", updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Search users for messaging
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id || req.user.id;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { userName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
    .select("firstName lastName userName profilePicture email")
    .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




// Add profile view tracking function
const trackProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user._id;

    // Don't track own profile views
    if (viewerId.toString() === userId) {
      return res.status(200).json({ message: "Own profile view not tracked" });
    }

    // Get profile owner details
    const profileOwner = await User.findById(userId, "firstName email userName connections");
    const viewer = await User.findById(viewerId, "firstName userName profilePicture");

    if (!profileOwner || !viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if notification already exist in last 24 hrs
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingNotification = await Notification.findOne({
      recipient: userId,
      type: "profile_view",
      relatedUser: viewerId,
      createdAt: { $gte: oneDayAgo }
    });

    if (existingNotification) {
      return res.status(200).json({ message: "Profile view already tracked recently" });
    }

    // Create notification record
    await Notification.create({
      recipient: userId,
      type: "profile_view",
      relatedUser: viewerId,
      content: `${viewer.firstName} ${viewer.lastName} viewed your profile`,
    });


    // Check if viewer is connected to profile owner
    const isConnected = profileOwner.connections.includes(viewerId);

    // Send email for connected users (remove random chance for testing)
    if (isConnected) {
      try {
        const viewerProfileUrl = process.env.CLIENT_URL + "/profile/" + viewer.userName;
        console.log("Sending profile view email to:", profileOwner.email);
        
        await sendProfileViewEmail(
          profileOwner.email,
          profileOwner.firstName,
          viewer.firstName,
          viewerProfileUrl
        );
        
        console.log("Profile view email sent successfully");
      } catch (error) {
        console.error("Error sending profile view email:", error);
        // Don't fail the request if email fails
      }
    }

    // Emit real-time notification via socket
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('profileViewed', {
        viewer: {
          _id: viewer._id,
          firstName: viewer.firstName,
          lastName: viewer.lastName,
          profilePicture: viewer.profilePicture,
          userName: viewer.userName
        }
      });
    }

    res.status(200).json({ message: "Profile view tracked successfully" });
  } catch (error) {
    console.error("Error tracking profile view:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { getSuggestedConnections, getPublicProfile, updateProfile, searchUsers, trackProfileView };