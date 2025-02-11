const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    _id: { 
      type: mongoose.Schema.Types.ObjectId, 
      auto: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    company: { 
      type: String, 
      required: true 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      validate: [dateValidator, "End date must be after start date"] 
    },
    description: { 
      type: String 
    },
    currentlyWorking: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);


const educationSchema = new mongoose.Schema(
  {
    _id: { 
      type: mongoose.Schema.Types.ObjectId, 
      auto: true 
    },
    school: { 
      type: String, 
      required: true 
    },
    fieldOfStudy: { 
      type: String 
    },
    startYear: { 
      type: Number 
    },
    endYear: { 
      type: Number, 
      validate: [yearValidator, "End year must be after start year"] 
    },
  },
  { timestamps: true }
);


const UserSchema = new mongoose.Schema(
  {
    firstName: { 
      type: String, 
      required: true 
    },
    lastName: { 
      type: String 
    },
    userName: { 
      type: String, 
      required: true, 
      unique: true 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 8 
    },
    profilePicture: { 
      type: String, 
      default: "" 
    },
    bannerImg: { 
      type: String, 
      default: "" 
    },
    headline: { 
      type: String, 
      default: "Linkedin User" 
    },
    about: { 
      type: String, 
      default: "" 
    },
    location: { 
      type: String, 
      default: "Location" 
    },
    experience: [experienceSchema],
    education: [educationSchema],
    skills: [{ type: String }],
    connections: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
  },
  { timestamps: true }
);

// Validation Functions
function dateValidator(value) {
  return !this.startDate || !value || value >= this.startDate;
}

function yearValidator(value) {
  return !this.startYear || !value || value >= this.startYear;
}

module.exports = mongoose.model("User", UserSchema);
