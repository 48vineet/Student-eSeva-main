const transporter = require("../config/mailer");
const { emailConfig } = require("../config/env");

/**
 * Send an email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html HTML content
 */
async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: emailConfig.user,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
