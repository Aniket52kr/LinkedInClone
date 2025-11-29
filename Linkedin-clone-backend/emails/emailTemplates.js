// welcome email template
function createWelcomeEmailTemplate(name, profileUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">      <title>Welcome to LinkedinClone by Aniket.dev</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LinkedIn!!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${name},</strong></p>
      <p>We're thrilled to have you join our professional community! LinkedIn is your platform to connect, learn, and grow in your career.</p>
      <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; margin: 0;"><strong>Here's how to get started:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Complete your profile</li>
          <li>Connect with colleagues and friends</li>
          <li>Join groups relevant to your interests</li>
          <li>Explore job opportunities</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Complete Your Profile</a>
      </div>
      <p>If you have any questions or need assistance, our support team is always here to help.</p>        <p>Best regards,<br>The LinkedIn Team</p>
    </div>
    </body>
    </html>
  `;
}



// connection accept email template
const createConnectionAcceptedEmailTemplate = (senderName, recipientName, profileUrl) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connection Request Accepted</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
      <h1 style="color: white; margin: 0; font-size: 28px;">Connection Accepted!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${senderName},</strong></p>
      <p>Great news! <strong>${recipientName}</strong> has accepted your connection request on LinkedIn.</p>
      <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; margin: 0;"><strong>What's next?</strong></p>
        <ul style="padding-left: 20px;">
          <li>Check out ${recipientName}'s full profile</li>
          <li>Send a message to start a conversation</li>
          <li>Explore mutual connections and interests</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View ${recipientName}'s Profile</a>
      </div>
      <p>Expanding your professional network opens up new opportunities. Keep connecting!</p>
      <p>Best regards,<br>The LinkedIn Team</p>
    </div>
  </body>
  </html>
  `;




// comment notification email template
const createCommentNotificationEmailTemplate = (
    recipientName,
    commenterName,
    postUrl,
    commentContent
  ) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Comment on Your Post</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
      <h1 style="color: white; margin: 0; font-size: 28px;">New Comment on Your Post</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${recipientName},</strong></p>
      <p>${commenterName} has commented on your post:</p>
      <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-style: italic; margin: 0;">"${commentContent}"</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${postUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Comment</a>
      </div>
      <p>Stay engaged with your network by responding to comments and fostering discussions.</p>
      <p>Best regards,<br>The LinkedIn Team</p>
    </div>
  </body>
  </html>
  `;




// Connection Request Email Template
const createConnectionRequestEmailTemplate = (senderName, recipientName, profileUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Connection Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="LinkedIn Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">New Connection Request!</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${recipientName},</strong></p>
    <p><strong>${senderName}</strong> wants to connect with you on LinkedIn!</p>
    <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>Why connect?</strong></p>
      <ul style="padding-left: 20px;">
        <li>Expand your professional network</li>
        <li>Discover new opportunities</li>
        <li>Share knowledge and experiences</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Request</a>
    </div>
    <p>Building meaningful connections is the key to professional growth.</p>
    <p>Best regards,<br>The LinkedIn Team</p>
  </div>
</body>
</html>
`;




// Like Notification Email Template
const createLikeNotificationEmailTemplate = (postAuthorName, likerName, postUrl, postContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Someone Liked Your Post</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="LinkedIn Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Post Got Liked! 🎉</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${postAuthorName},</strong></p>
    <p><strong>${likerName}</strong> liked your post!</p>
    <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 14px; margin: 0; font-style: italic;">"${postContent.substring(0, 150)}${postContent.length > 150 ? '...' : ''}"</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${postUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Post</a>
    </div>
    <p>Your content is resonating with your network. Keep sharing valuable insights!</p>
    <p>Best regards,<br>The LinkedIn Team</p>
  </div>
</body>
</html>
`;




// Message Notification Email Template
const createMessageNotificationEmailTemplate = (recipientName, senderName, messageContent, profileUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="LinkedIn Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">New Message! 💬</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${recipientName},</strong></p>
    <p>You have a new message from <strong>${senderName}</strong>:</p>
    <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-style: italic; margin: 0;">"${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Reply to Message</a>
    </div>
    <p>Stay connected and keep the conversation going!</p>
    <p>Best regards,<br>The LinkedIn Team</p>
  </div>
</body>
</html>
`;




// Profile View Notification Email Template
const createProfileViewEmailTemplate = (profileOwnerName, viewerName, viewerProfileUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Someone Viewed Your Profile</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="LinkedIn Logo" style="width: 150px; margin-bottom: 20px;border-radius: 10px;"/>
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Profile is Getting Noticed! 👀</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${profileOwnerName},</strong></p>
    <p><strong>${viewerName}</strong> recently viewed your profile!</p>
    <div style="background-color: #f3f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>This could mean:</strong></p>
      <ul style="padding-left: 20px;">
        <li>Potential networking opportunity</li>
        <li>Interest in your professional background</li>
        <li>Recruiter or hiring manager scouting talent</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewerProfileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Their Profile</a>
    </div>
    <p>Consider reaching out to make a valuable connection!</p>
    <p>Best regards,<br>The LinkedIn Team</p>
  </div>
</body>
</html>
`;




module.exports = {
  createWelcomeEmailTemplate,
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
  createConnectionRequestEmailTemplate,
  createLikeNotificationEmailTemplate,
  createMessageNotificationEmailTemplate,
  createProfileViewEmailTemplate
};