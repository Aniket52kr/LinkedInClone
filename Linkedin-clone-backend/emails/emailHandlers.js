const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const {
  createWelcomeEmailTemplate,
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
  createConnectionRequestEmailTemplate,
  createLikeNotificationEmailTemplate,
  createMessageNotificationEmailTemplate,
  createProfileViewEmailTemplate,
} = require("./emailTemplates");

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_HOST,
  port: process.env.GMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Gmail transporter error:", error);
  } else {
    console.log("Gmail server is ready to send emails");
  }
});

const sender = {
  email: process.env.GMAIL_EMAIL,
  name: process.env.MAILTRAP_SENDER_NAME || "LinkedIn Clone",
};

// Send Welcome Email
const sendWelcomeEmail = async (email, firstName, lastName, profileUrl) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Welcome to LinkedInClone by Aniket.dev!",
      html: createWelcomeEmailTemplate(firstName, lastName, profileUrl),
    });

    console.log("Welcome Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error.message);
  }
};

// Send Comment Notification Email
const sendCommentNotificationEmail = async (
  recipientEmail,
  recipientName,
  commenterName,
  postUrl,
  commentContent
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipientEmail,
      subject: "New Comment on your post",
      html: createCommentNotificationEmailTemplate(
        recipientName,
        commenterName,
        postUrl,
        commentContent
      ),
    });

    console.log("Comment Notification Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending comment notification email:", error.message);
  }
};

// Send Connection Accepted Email
const sendConnectionAcceptedEmail = async (
  senderEmail,
  senderName,
  recipientName,
  profileUrl
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: senderEmail,
      subject: `Your connection request has been accepted by ${recipientName}`,
      html: createConnectionAcceptedEmailTemplate(
        recipientName,
        senderName,
        profileUrl
      ),
    });

    console.log("Connection Accepted Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending connection accepted email:", error.message);
  }
};

// Send Connection Request Email
const sendConnectionRequestEmail = async (
  recipientEmail,
  recipientName,
  senderName,
  profileUrl
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipientEmail,
      subject: `${senderName} wants to connect with you on LinkedIn`,
      html: createConnectionRequestEmailTemplate(senderName, recipientName, profileUrl),
    });

    console.log("Connection Request Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending connection request email:", error.message);
  }
};

// Send Like Notification Email
const sendLikeNotificationEmail = async (
  recipientEmail,
  recipientName,
  likerName,
  postUrl,
  postContent
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipientEmail,
      subject: `${likerName} liked your post on LinkedIn`,
      html: createLikeNotificationEmailTemplate(recipientName, likerName, postUrl, postContent),
    });

    console.log("Like Notification Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending like notification email:", error.message);
  }
};

// Send Message Notification Email
const sendMessageNotificationEmail = async (
  recipientEmail,
  recipientName,
  senderName,
  messageContent,
  profileUrl
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipientEmail,
      subject: `New message from ${senderName} on LinkedIn`,
      html: createMessageNotificationEmailTemplate(recipientName, senderName, messageContent, profileUrl),
    });

    console.log("Message Notification Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending message notification email:", error.message);
  }
};

// Send Profile View Email
const sendProfileViewEmail = async (
  recipientEmail,
  recipientName,
  viewerName,
  viewerProfileUrl
) => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipientEmail,
      subject: `${viewerName} viewed your profile on LinkedIn`,
      html: createProfileViewEmailTemplate(recipientName, viewerName, viewerProfileUrl),
    });

    console.log("Profile View Email sent successfully", response.messageId);
  } catch (error) {
    console.error("Error sending profile view email:", error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCommentNotificationEmail,
  sendConnectionAcceptedEmail,
  sendConnectionRequestEmail,
  sendLikeNotificationEmail,
  sendMessageNotificationEmail,
  sendProfileViewEmail,
};