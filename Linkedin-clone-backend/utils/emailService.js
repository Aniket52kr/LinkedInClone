const {
  sendWelcomeEmail,
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
  sendCommentNotificationEmail,
  sendLikeNotificationEmail,
  sendMessageNotificationEmail,
  sendProfileViewEmail,
} = require("../emails/emailHandlers");



class EmailService {
  static async sendEmail(type, recipientData, senderData, additionalData = {}) {
    try {
      // Check user's email preferences
      const userPreferences = recipientData.emailPreferences || {};
      
      // Skip email if user has disabled this type
      if (!this.checkEmailPreference(type, userPreferences)) {
        console.log(`Email type ${type} disabled for user ${recipientData.email}`);
        return;
      }

      switch (type) {
        case 'welcome':
          await sendWelcomeEmail(
            recipientData.email,
            recipientData.firstName,
            recipientData.lastName,
            additionalData.profileUrl
          );
          break;

        case 'connection_request':
          await sendConnectionRequestEmail(
            recipientData.email,
            recipientData.firstName,
            senderData.firstName,
            additionalData.profileUrl
          );
          break;

        case 'connection_accepted':
          await sendConnectionAcceptedEmail(
            recipientData.email,
            senderData.firstName,
            recipientData.firstName,
            additionalData.profileUrl
          );
          break;

        case 'comment':
          await sendCommentNotificationEmail(
            recipientData.email,
            recipientData.firstName,
            senderData.firstName,
            additionalData.postUrl,
            additionalData.commentContent
          );
          break;

        case 'like':
          await sendLikeNotificationEmail(
            recipientData.email,
            recipientData.firstName,
            senderData.firstName,
            additionalData.postUrl,
            additionalData.postContent
          );
          break;

        case 'message':
          await sendMessageNotificationEmail(
            recipientData.email,
            recipientData.firstName,
            senderData.firstName,
            additionalData.messageContent,
            additionalData.profileUrl
          );
          break;

        case 'profile_view':
          await sendProfileViewEmail(
            recipientData.email,
            recipientData.firstName,
            senderData.firstName,
            additionalData.viewerProfileUrl
          );
          break;

        default:
          console.log(`Unknown email type: ${type}`);
      }
    } catch (error) {
      console.error(`Error sending ${type} email:`, error);
    }
  }
  

  static checkEmailPreference(type, preferences) {
    const preferenceMap = {
      'welcome': true, // Always send welcome emails
      'connection_request': preferences.connectionRequests,
      'connection_accepted': preferences.connectionAccepted,
      'comment': preferences.postComments,
      'like': preferences.postLikes,
      'message': preferences.messageNotifications,
      'profile_view': preferences.profileViews,
    };

    return preferenceMap[type] !== false;
  }
}

module.exports = EmailService;