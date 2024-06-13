const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

const sendResetPasswordEmail = (to, token) => {
  const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Password Reset',
    text: `Click on the following link to reset your password: ${resetLink}`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };
