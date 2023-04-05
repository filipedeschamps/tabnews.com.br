import { ValidationError } from 'errors';

const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

async function recaptchaHandler(request, response_, next) {
  const recaptchaToken = request.headers['x-recaptcha-token'];

  if (!recaptchaToken || recaptchaToken === '') {
    throw new ValidationError({
      key: 'recaptcha',
      message: 'Desafio não foi respondido.',
      action: 'Por favor, responda o desafio.',
      errorLocationCode: 'MODEL:VALIDATOR::RECAPTCHA_HANDLER:RECAPTCHA_TOKEN_NOT_FOUND',
      stack: new Error().stack,
    });
  }

  const successTestCennario = !process.env.VERCEL_ENV && recaptchaToken === 'recaptcha-token-test';
  if (successTestCennario) {
    next();
    return;
  }

  const baseURL = 'https://www.google.com/recaptcha/api/siteverify';
  const response = await fetch(`${baseURL}?secret=${recaptchaSecretKey}&response=${recaptchaToken}`);
  const responseBody = await response.json();

  if (responseBody.success) {
    next();
  } else {
    throw new ValidationError({
      key: 'recaptcha',
      message: 'Desafio inválido ou expirado.',
      action: 'Por favor, responda novamente o desafio.',
      errorLocationCode: 'MODEL:VALIDATOR::RECAPTCHA_HANDLER:RECAPTCHA_TOKEN_NOT_VALID',
      stack: new Error().stack,
    });
  }
}

export default recaptchaHandler;
