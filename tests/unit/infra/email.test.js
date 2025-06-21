import nodemailer from 'nodemailer';

import logger from 'infra/logger';
import webserver from 'infra/webserver';

const mocks = vi.hoisted(() => ({
  resendSendMail: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mocks.resendSendMail,
    },
  })),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

vi.mock('infra/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock('infra/webserver', () => ({
  default: {
    isServerlessRuntime: false,
  },
}));

let send;
let originalEnv;
const sendMail = vi.fn();

const defaultTestEnv = {
  EMAIL_SMTP_HOST: 'host.test',
  EMAIL_SMTP_PORT: 1025,
  EMAIL_USER: 'email_user_test',
  EMAIL_PASSWORD: 'email_password_test',
  RETRIES_PER_EMAIL_SERVICE: '1',
  EMAIL_ATTEMPT_TIMEOUT_IN_SECONDS: '40',
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
  originalEnv = { ...process.env }; // Store a copy
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sendMail.mockResolvedValue();
  nodemailer.createTransport.mockReturnValue({ sendMail });
});

afterAll(() => {
  process.env = originalEnv; // Restore original environment
});

describe('infra/email > send', () => {
  describe('With single email service', () => {
    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        ...defaultTestEnv,
      };

      send = await import('infra/email').then((module) => module.default.send);
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
      expect(logger.error).toHaveBeenCalledWith(getExpectedError());
    });

    it('should retry if sending the email fails once', async () => {
      sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(getExpectedError());
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

    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        ...defaultTestEnv,
        ...secondEmailServiceEnv,
      };

      send = await import('infra/email').then((module) => module.default.send);
    });

    afterAll(() => {
      webserver.isServerlessRuntime = false;
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
      expect(logger.error).toHaveBeenCalledWith(getExpectedError());
    });

    it('should retry with alternative email service', async () => {
      sendMail.mockRejectedValueOnce(new Error('Failed to send email'));
      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({ ...defaultMailOptions, secure: true });
      expect(nodemailer.createTransport).toHaveBeenCalledWith(secondMailOptions);

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(getExpectedError());
    });
  });

  describe('With "Resend" service', () => {
    beforeEach(() => {
      mocks.resendSendMail.mockResolvedValue({
        data: 'Email sent',
        error: null,
      });
    });

    describe('Only "Resend" service', () => {
      const resendTestEnv = {
        EMAIL_USER: 'resend',
        EMAIL_PASSWORD: 're_password_test',
      };

      beforeEach(async () => {
        process.env = {
          ...originalEnv,
          ...defaultTestEnv,
          ...resendTestEnv,
        };

        send = await import('infra/email').then((module) => module.default.send);
      });

      it('should not initialize as a transporter', () => {
        expect(nodemailer.createTransport).not.toHaveBeenCalled();
      });

      it('should send an email with the provided options', async () => {
        await expect(send(defaultEmailData)).resolves.not.toThrow();

        expect(mocks.resendSendMail).toHaveBeenCalledWith(defaultEmailData);
      });

      it('should throw an error if sending the email fails all attempts', async () => {
        mocks.resendSendMail.mockRejectedValue(new Error('Failed to send email'));

        await expect(send(defaultEmailData)).rejects.toThrow('Failed to send email');

        expect(mocks.resendSendMail).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledWith(getExpectedError());
      });

      it('should retry if sending the email fails once', async () => {
        mocks.resendSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        await expect(send(defaultEmailData)).resolves.not.toThrow();

        expect(mocks.resendSendMail).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(getExpectedError());
      });
    });

    describe('With "Resend" and two other services', () => {
      const resendTestEnv = {
        EMAIL_USER2: 'resend',
        EMAIL_PASSWORD2: 're_password_test',
      };

      const thirdEmailServiceEnv = {
        EMAIL_SMTP_HOST3: 'host.test3',
        EMAIL_SMTP_PORT3: 1026,
        EMAIL_USER3: 'email_user_test3',
        EMAIL_PASSWORD3: 'email_password_test3',
      };

      const thirdMailOptions = {
        auth: {
          user: thirdEmailServiceEnv.EMAIL_USER3,
          pass: thirdEmailServiceEnv.EMAIL_PASSWORD3,
        },
        secure: false,
        host: thirdEmailServiceEnv.EMAIL_SMTP_HOST3,
        port: thirdEmailServiceEnv.EMAIL_SMTP_PORT3,
      };

      beforeEach(async () => {
        process.env = {
          ...originalEnv,
          ...defaultTestEnv,
          ...resendTestEnv,
          ...thirdEmailServiceEnv,
        };

        send = await import('infra/email').then((module) => module.default.send);
      });

      it('should initialize the transporters', () => {
        // Resend service is not initialized as a transporter
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
        expect(nodemailer.createTransport).toHaveBeenCalledWith(defaultMailOptions);
        expect(nodemailer.createTransport).toHaveBeenCalledWith(thirdMailOptions);
      });

      it('should send an email with the provided options', async () => {
        await expect(send(defaultEmailData)).resolves.not.toThrow();

        expect(sendMail).toHaveBeenCalledWith(defaultEmailData);
        expect(mocks.resendSendMail).not.toHaveBeenCalled();
      });

      it('should throw an error if sending the email fails all attempts', async () => {
        sendMail.mockRejectedValue(new Error('Failed to send email'));
        mocks.resendSendMail.mockRejectedValue(new Error('Failed to send email'));

        await expect(send(defaultEmailData)).rejects.toThrow('Failed to send email');

        expect(sendMail).toHaveBeenCalledTimes(4);
        expect(mocks.resendSendMail).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledTimes(6);
        expect(logger.error).toHaveBeenCalledWith(getExpectedError());
      });

      it('should retry with "Resend" service', async () => {
        sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        await expect(send(defaultEmailData)).resolves.not.toThrow();

        expect(sendMail).toHaveBeenCalledOnce();
        expect(mocks.resendSendMail).toHaveBeenCalledOnce();
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(getExpectedError());
      });

      it('should retry after "Resend" attempt', async () => {
        sendMail.mockRejectedValueOnce(new Error('Failed to send email'));
        mocks.resendSendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        await expect(send(defaultEmailData)).resolves.not.toThrow();

        expect(sendMail).toHaveBeenCalledTimes(2);
        expect(mocks.resendSendMail).toHaveBeenCalledOnce();
        expect(logger.error).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledWith(getExpectedError());
      });
    });
  });

  describe('Custom retry options', () => {
    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        ...defaultTestEnv,
        EMAIL_ATTEMPT_TIMEOUT_IN_SECONDS: '1',
        RETRIES_PER_EMAIL_SERVICE: '2',
      };

      send = await import('infra/email').then((module) => module.default.send);
    });

    it('should retry with custom `RETRIES_PER_EMAIL_SERVICE`', async () => {
      sendMail.mockRejectedValue(new Error('Failed to send email'));

      await expect(send(defaultEmailData)).rejects.toThrow('Failed to send email');

      expect(sendMail).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(getExpectedError());
    });

    it('should retry after timeout (`EMAIL_ATTEMPT_TIMEOUT_IN_SECONDS`)', async () => {
      sendMail.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(new Error('Failed to send email')), 1100)),
      );

      await expect(send(defaultEmailData)).resolves.not.toThrow();

      expect(sendMail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        getExpectedError({ message: 'Timeout: Email sending took longer than 1 second(s)' }),
      );
    });
  });
});

function getExpectedError(props) {
  return expect.objectContaining({
    name: 'ServiceError',
    message: 'Failed to send email',
    ...props,
  });
}

describe('MC/DC Coverage for Secondary SMTP Service (EMAIL_SMTP_HOST2)', () => {
  const host2MailOptions = (secure = false) => ({
    auth: {
      user: 'user_host2',
      pass: 'pass_host2',
    },
    secure,
    host: 'host2.test',
    port: 1027,
  });

  // Corresponds to MC/DC Case 1: HOST2=T, isServerless=T, FORCE_SECURE=F => Outcome T (Service 2 added, secure=true)
  it('should add smtpService2 (secure) when HOST2 is set, isServerlessRuntime is true, and FORCE_SECURE is not set', async () => {
    process.env = {
      ...originalEnv,
      ...defaultTestEnv,
      EMAIL_SMTP_HOST2: 'host2.test',
      EMAIL_SMTP_PORT2: 1027,
      EMAIL_USER2: 'user_host2',
      EMAIL_PASSWORD2: 'pass_host2',
    };
    webserver.isServerlessRuntime = true;
    send = await import('infra/email').then((module) => module.default.send);
    await send(defaultEmailData);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining(host2MailOptions(true)));
  });

  // Corresponds to MC/DC Case 2: HOST2=F, isServerless=T, FORCE_SECURE=F => Outcome F (Service 2 not added)
  it('should NOT add smtpService2 when HOST2 is NOT set (even if isServerlessRuntime is true)', async () => {
    process.env = {
      ...originalEnv,
      ...defaultTestEnv, 
    };
    webserver.isServerlessRuntime = true;
    send = await import('infra/email').then((module) => module.default.send);
    await send(defaultEmailData);
    expect(nodemailer.createTransport).not.toHaveBeenCalledWith(expect.objectContaining({ host: 'host2.test' }));
  });

  // Corresponds to MC/DC Case 4: HOST2=T, isServerless=F, FORCE_SECURE=F => Outcome F (Service 2 not added)
  it('should add smtpService2 with secure:false when HOST2 is set, isServerlessRuntime is false, and FORCE_SECURE is false', async () => {
    process.env = {
      ...originalEnv,
      ...defaultTestEnv,
      EMAIL_SMTP_HOST2: 'host2.test',
      EMAIL_SMTP_PORT2: 1027,
      EMAIL_USER2: 'user_host2',
      EMAIL_PASSWORD2: 'pass_host2',
    };
    webserver.isServerlessRuntime = false;
    send = await import('infra/email').then((module) => module.default.send);
    await send(defaultEmailData);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining(host2MailOptions(false)));
  });

  // Corresponds to MC/DC Case 5: HOST2=T, isServerless=F, FORCE_SECURE=T => Outcome T (Service 2 added, secure=true)
  it('should add smtpService2 (secure) when HOST2 is set, isServerlessRuntime is false, but FORCE_SECURE is true', async () => {
    process.env = {
      ...originalEnv,
      ...defaultTestEnv,
      EMAIL_SMTP_HOST2: 'host2.test',
      EMAIL_SMTP_PORT2: 1027,
      EMAIL_USER2: 'user_host2',
      EMAIL_PASSWORD2: 'pass_host2',
      EMAIL_SMTP_HOST2_FORCE_SECURE: 'true',
    };
    webserver.isServerlessRuntime = false;
    send = await import('infra/email').then((module) => module.default.send);
    await send(defaultEmailData);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining(host2MailOptions(false)));
  });
});