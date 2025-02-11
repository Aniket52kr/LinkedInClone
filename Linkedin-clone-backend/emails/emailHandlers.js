const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config();

const {
  createWelcomeEmailTemplate,
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
} = require("./emailTemplates");

// Define sender correctly
const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL,
  name: process.env.MAILTRAP_SENDER_NAME,
};

// Initialize Mailtrap Client
const mailtrapClient = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});


// Send Welcome Email
const sendWelcomeEmail = async (email, firstName, lastName, profileUrl) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Welcome to LinkedInClone by Aniket.dev!",
      html: createWelcomeEmailTemplate(firstName, lastName, profileUrl),
      category: "welcome",
    });

    console.log("Welcome Email sent successfully", response);
  } catch (error) {
    console.error("Error sending welcome email:", error.response?.data || error.message);
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
  const recipient = [{ email: recipientEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "New Comment on your post",
      html: createCommentNotificationEmailTemplate(
        recipientName,
        commenterName,
        postUrl,
        commentContent
      ),
      category: "comment_notification",
    });

    console.log("Comment Notification Email sent successfully", response);
  } catch (error) {
    console.error("Error sending comment notification email:", error.response?.data || error.message);
  }
};



// Send Connection Accepted Email
const sendConnectionAcceptedEmail = async (
  senderEmail,
  senderName,
  recipientName,
  profileUrl
) => {
  const recipient = [{ email: senderEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: `Your connection request has been accepted by ${recipientName}`,
      html: createConnectionAcceptedEmailTemplate(
        recipientName,
        senderName,
        profileUrl
      ),
    });

    console.log("Connection Accepted Email sent successfully", response);
  } catch (error) {
    console.error("Error sending connection accepted email:", error.response?.data || error.message);
  }
};



module.exports = {
  sendWelcomeEmail,
  sendCommentNotificationEmail,
  sendConnectionAcceptedEmail,
};
