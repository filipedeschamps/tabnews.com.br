import { RecaptchaError } from 'errors';

const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

async function recaptchaHandler(request, response_, next) {
  const recaptchaToken = request.body.recaptchaToken;
  const baseURL = 'https://www.google.com/recaptcha/api/siteverify';

  const response = await fetch(`${baseURL}?secret=${recaptchaSecretKey}&response=${recaptchaToken}`);

  const responseBody = await response.json();

  if (responseBody.success) {
    next();
  } else {
    throw new RecaptchaError();
  }
}

export default recaptchaHandler;
