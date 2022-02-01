const nodemailer = require('nodemailer');

const transporterConfiguration = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
  transporterConfiguration.secure = false;
}

const transporter = nodemailer.createTransport(transporterConfiguration);

async function send({ from, to, subject, text }) {
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    text: text,
  };

  await transporter.sendMail(mailOptions);
}

export default Object.freeze({
  send,
});
