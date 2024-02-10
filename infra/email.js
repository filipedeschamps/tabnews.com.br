import nodemailer from 'nodemailer';

import { ServiceError } from 'errors';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';

const transporterConfiguration = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

if (!webserver.isServerlessRuntime) {
  transporterConfiguration.secure = false;
}

const transporter = nodemailer.createTransport(transporterConfiguration);

async function send({ from, to, subject, html, text }) {
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: html,
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
