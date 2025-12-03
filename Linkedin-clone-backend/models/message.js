const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: function() {
        // Content is only required for text messages
        return this.messageType === 'text';
      },
  
      trim: true,
      default: function() {
        // For non-text messages, provide empty default
        return this.messageType === 'text' ? undefined : '';
      }
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    filePublicId: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },
     
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
    },
    
  },
  { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);