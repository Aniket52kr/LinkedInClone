const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN;

if (!TOKEN) {
  console.error("MAILTRAP_TOKEN not found in environment variables!");
  console.log("Available env vars:", Object.keys(process.env).filter(key => key.includes('MAIL')));
  process.exit(1);
}

console.log("MAILTRAP_TOKEN found:", TOKEN.substring(0, 10) + "...");

const mailtrapClient = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL,
  name: process.env.MAILTRAP_SENDER_NAME,
};

console.log("Sender:", sender);

const recipients = [
  {
    email: "aniketbawankar2021@gmail.com",
  },
];

console.log("Sending test email...");

mailtrapClient
  .send({
    from: sender,
    to: recipients,
    subject: "Test Email from LinkedIn Clone",
    text: "Congrats! Your email system is working with Mailtrap!",
    html: `<h1>Test Email</h1><p>Congrats! Your email system is working with Mailtrap!</p>`,
    category: "Integration Test",
  })
  .then((response) => {
    console.log("Email sent successfully:", response);
  })
  .catch((error) => {
    console.error("Error sending email:", error.response?.data || error.message);
  });

module.exports = { mailtrapClient, sender, recipients };