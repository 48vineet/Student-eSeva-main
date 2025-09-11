const nodemailer = require("nodemailer");
const { emailConfig } = require("./env"); // Make sure env.js exports emailConfig

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  },
});

module.exports = transporter;
