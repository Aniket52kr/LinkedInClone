const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN;

const mailtrapClient = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: process.env.EMAIL_FROM,
  name: process.env.EMAIL_FROM_NAME,
};

const recipients = [
  {
    email: "aniketbawankar2021@gmail.com",
  },
];

mailtrapClient
  .sendMessage({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log)
  .catch(console.error);

module.exports = { mailtrapClient, sender, recipients };