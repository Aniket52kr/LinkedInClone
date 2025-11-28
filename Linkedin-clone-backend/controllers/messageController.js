const Message = require("../models/message");
const User = require("../models/user");
const { emitSocketEvent } = require("../lib/socket");
const multer = require("multer");
const cloudinary = require("../lib/cloudinary");
const { sendMessageNotificationEmail } = require("../emails/emailHandlers");

 

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});
exports.upload = upload;



// Upload file to Cloudinary
const uploadFile = async (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: `linkedin/messages/${folder}`,
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};



// Get conversations list for a user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all messages where user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ]
    })
    .populate("sender", "firstName lastName userName profilePicture")
    .populate("recipient", "firstName lastName userName profilePicture")
    .sort({ createdAt: -1 });

    // Group messages by conversation partner
    const conversations = new Map();
    
    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === currentUserId 
        ? message.recipient._id.toString() 
        : message.sender._id.toString();
      
      const partner = message.sender._id.toString() === currentUserId 
        ? message.recipient 
        : message.sender;

      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          user: partner,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (message.recipient._id.toString() === currentUserId && !message.isRead) {
        const conv = conversations.get(partnerId);
        conv.unreadCount++;
      }
    });

    res.status(200).json(Array.from(conversations.values()));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .populate("sender", "firstName lastName userName profilePicture")
    .populate("recipient", "firstName lastName userName profilePicture")
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, recipient: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', fileUrl, filePublicId } = req.body;
    const senderId = req.user._id || req.user.id;

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content || '',
      messageType,
      fileUrl,
      filePublicId,
    });

    await message.save();
    await message.populate('sender', 'firstName lastName profilePicture');
    await message.populate('recipient', 'firstName lastName profilePicture');

    // Get recipient details for email
    const recipient = await User.findById(recipientId, "firstName email userName");

    // Send email notification for new message (only for text messages)
    if (messageType === 'text' && content && recipient) {
      try {
        const profileUrl = process.env.CLIENT_URL + "/messages";
        await sendMessageNotificationEmail(
          recipient.email,
          recipient.firstName,
          message.sender.firstName,
          content,
          profileUrl
        );
      } catch (error) {
        console.error("Error sending message notification email:", error);
      }
    }

    
    // Emit socket event for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId).emit('newMessage', message);
      io.to(senderId).emit('newMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};




exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const senderId = req.user._id || req.user.id;

    console.log('Delete request - User ID:', senderId);
    console.log('Delete request - Message ID:', messageId);

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    console.log('Message sender ID:', message.sender.toString());
    console.log('Comparison:', message.sender.toString() === senderId);

    // Check if user is the sender
    if (message.sender.toString() !== senderId.toString()) {
      console.log('Authorization failed');
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Delete file from Cloudinary if exists
    if (message.filePublicId) {
      await cloudinary.uploader.destroy(message.filePublicId, {
        resource_type: message.messageType === 'image' ? 'image' : 'raw'
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit socket event for real-time deletion
    const io = req.app.get('io');
    if (io) {
      io.to(message.recipient.toString()).emit('messageDeleted', messageId);
      io.to(senderId).emit('messageDeleted', messageId);
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};



// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await Message.updateMany(
      { sender: userId, recipient: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};





// Send message with file attachment
exports.sendMessageWithFile = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id || req.user.id;

    let fileUrl = null;
    let filePublicId = null;
    let messageType = 'text';

    // Handle file upload
    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';
      
      const uploadResult = await uploadFile(
        req.file.buffer,
        `${senderId}/${recipientId}`,
        resourceType
      );
      
      fileUrl = uploadResult.secure_url;
      filePublicId = uploadResult.public_id;
      messageType = isImage ? 'image' : 'file';
    }

    // For file messages, content can be optional
    const messageContent = content || '';

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: messageContent,
      messageType,
      fileUrl,
      filePublicId,
    });

    await message.save();
    await message.populate('sender', 'firstName lastName profilePicture');
    await message.populate('recipient', 'firstName lastName profilePicture');

    // Emit socket event for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId).emit('newMessage', message);
      io.to(senderId).emit('newMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};





// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id || req.user.id;

    console.log('Edit request - User ID:', senderId);
    console.log('Edit request - Message ID:', messageId);
    console.log('Edit request - New content:', content);

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    console.log('Message sender ID:', message.sender.toString());

    // Check if user is the sender
    if (message.sender.toString() !== senderId.toString()) {
      console.log('Authorization failed');
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Update message content and edit status
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate('sender', 'firstName lastName profilePicture');
    await message.populate('recipient', 'firstName lastName profilePicture');

    console.log('Message updated successfully');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(message.recipient.toString()).emit('messageEdited', message);
      io.to(senderId).emit('messageEdited', message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};