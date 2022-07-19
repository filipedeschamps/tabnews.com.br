const nodemailer = require('nodemailer');
import { ServiceError } from 'errors/index.js';
import logger from './logger.js';

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

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const errorObject = new ServiceError({
      message: error.message,
      action: 'Verifique se o serviço de emails está disponível.',
      stack: error.stack,
      context: mailOptions,
      errorLocationCode: 'INFRA:EMAIl:SEND',
    });
    logger.error(errorObject);
    throw errorObject;
  }
}

export default Object.freeze({
  send,
});
