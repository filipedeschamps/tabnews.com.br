import nodemailer from 'nodemailer';

import { ServiceError } from 'errors';
import logger from 'infra/logger';
import webserver from 'infra/webserver';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

jest.mock('infra/logger', () => ({
  error: jest.fn(),
}));

jest.mock('infra/webserver', () => ({
  isServerlessRuntime: false,
}));

describe('infra/email > send', () => {
  let send;
  let originalEnv;
  const sendMail = jest.fn();

  const defaultTestEnv = {
    EMAIL_SMTP_HOST: 'host.test',
    EMAIL_SMTP_PORT: 1025,
    EMAIL_USER: 'email_user_test',
    EMAIL_PASSWORD: 'email_password_test',
  };

  const defaultMailOptions = {
    auth: {
      user: defaultTestEnv.EMAIL_USER,
      pass: defaultTestEnv.EMAIL_PASSWORD,
    },
    secure: false,
    host: defaultTestEnv.EMAIL_SMTP_HOST,
    port: defaultTestEnv.EMAIL_SMTP_PORT,
  };

  const defaultEmailData = {
    from: 'test@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email',
    html: '<p>Test HTML</p>',
    text: 'Test Text',
  };

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockResolvedValue();
    nodemailer.createTransport.mockReturnValue({ sendMail });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('With single email service', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        ...defaultTestEnv,
      };

      jest.isolateModules(() => {
        delete require.cache[require.resolve('infra/email')];
        const { default: email } = require('infra/email');
        send = email.send;
      });
    });

    it('should send an email with the provided options', async () => {
      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(defaultMailOptions);
      expect(sendMail).toHaveBeenCalledWith(defaultEmailData);
    });

    it('should throw an error if sending the email fails all attempts', async () => {
      sendMail.mockRejectedValue(new Error('Failed to send email'));

      await expect(send(defaultEmailData)).rejects.toThrow('Failed to send email');

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(new ServiceError({ message: 'Failed to send email' }));
    });

    it('should retry if sending the email fails once', async () => {
      sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(new ServiceError({ message: 'Failed to send email' }));
    });
  });

  describe('With two email services', () => {
    const secondEmailServiceEnv = {
      EMAIL_SMTP_HOST2: 'host.test2',
      EMAIL_SMTP_PORT2: 1026,
      EMAIL_USER2: 'email_user_test2',
      EMAIL_PASSWORD2: 'email_password_test2',
    };

    const secondMailOptions = {
      auth: {
        user: secondEmailServiceEnv.EMAIL_USER2,
        pass: secondEmailServiceEnv.EMAIL_PASSWORD2,
      },
      secure: true,
      host: secondEmailServiceEnv.EMAIL_SMTP_HOST2,
      port: secondEmailServiceEnv.EMAIL_SMTP_PORT2,
    };

    beforeAll(() => {
      webserver.isServerlessRuntime = true;
    });

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        ...defaultTestEnv,
        ...secondEmailServiceEnv,
      };

      jest.isolateModules(() => {
        delete require.cache[require.resolve('infra/email')];
        const { default: email } = require('infra/email');
        send = email.send;
      });
    });

    it('should send an email with the provided options', async () => {
      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({ ...defaultMailOptions, secure: true });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(secondMailOptions);
      expect(sendMail).toHaveBeenCalledWith(defaultEmailData);
    });

    it('should throw an error if sending the email fails all attempts', async () => {
      sendMail.mockRejectedValue(new Error('Failed to send email'));

      await expect(send(defaultEmailData)).rejects.toThrow('Failed to send email');
      expect(sendMail).toHaveBeenCalledTimes(4);
      expect(logger.error).toHaveBeenCalledTimes(4);
      expect(logger.error).toHaveBeenCalledWith(new ServiceError({ message: 'Failed to send email' }));
    });

    it('should retry with alternative email service', async () => {
      sendMail.mockRejectedValueOnce(new Error('Failed to send email'));
      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({ ...defaultMailOptions, secure: true });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(secondMailOptions);

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(new ServiceError({ message: 'Failed to send email' }));
    });
  });
});
