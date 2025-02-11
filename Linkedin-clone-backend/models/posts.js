const mongoose = require("mongoose");


const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { 
      type: String 
    },
    fileUrl: { 
      type: String 
    },
    fileType: { 
      type: String 
    }, 
    filePublicId: { 
      type: String 
    }, 
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        content: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);


module.exports = mongoose.model("Post", postSchema);
