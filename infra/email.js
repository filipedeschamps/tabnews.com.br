import retry from 'async-retry';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

import { ServiceError } from 'errors';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';

const RETRIES_PER_EMAIL_SERVICE = 1;

const transporterConfigs = [];
let configNumber = '';

while (process.env['EMAIL_SMTP_HOST' + configNumber]) {
  transporterConfigs.push({
    host: process.env['EMAIL_SMTP_HOST' + configNumber],
    port: process.env['EMAIL_SMTP_PORT' + configNumber],
    secure: webserver.isServerlessRuntime,
    auth: {
      user: process.env['EMAIL_USER' + configNumber],
      pass: process.env['EMAIL_PASSWORD' + configNumber],
    },
  });

  configNumber = transporterConfigs.length + 1;
}

const transporters = transporterConfigs.map((config) => {
  if (config.auth.user === 'resend') {
    const resend = new Resend(config.auth.pass);

    return {
      sendMail: async (mailOptions) => {
        const { data, error } = await resend.emails.send(mailOptions);

        if (error) {
          throw error;
        }

        return data;
      },
    };
  }

  return nodemailer.createTransport(config);
});

const retries = (RETRIES_PER_EMAIL_SERVICE + 1) * transporters.length - 1;

async function send({ from, to, subject, html, text }) {
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: html,
    text: text,
  };

  try {
    await retry(tryToSendEmail, {
      retries,
      minTimeout: 0,
      maxTimeout: 0,
      factor: 0,
      randomize: false,
      onRetry: logError,
    });
  } catch (error) {
    logError(error, retries + 1);
    throw error;
  }

  async function tryToSendEmail(bail, attempt) {
    const configIndex = (attempt - 1) % transporters.length;
    const transporter = transporters[configIndex];

    await transporter.sendMail(mailOptions);
  }

  function logError(error, attempt) {
    const configIndex = (attempt - 1) % transporters.length;

    const errorObject = new ServiceError({
      message: error.message,
      action: 'Verifique se o serviço de emails está disponível.',
      stack: error.stack,
      context: {
        attempt,
        emailSmtpHost: transporterConfigs[configIndex].host,
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      },
      errorLocationCode: 'INFRA:EMAIl:SEND',
    });
    logger.error(errorObject);
  }
}

export default Object.freeze({
  send,
});
