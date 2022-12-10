import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { UnauthorizedError, ForbiddenError } from '/errors/index.js';
import activation from 'models/activation.js';
import validator from 'models/validator.js';
import session from 'models/session';
import emailConfirmation from 'models/email-confirmation.js';
import axios from 'axios';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(authorization.canRequest('read:session'), getHandler)
  .delete(authorization.canRequest('read:session'), deleteHandler)
  .post(postValidationHandler, authorization.canRequest('create:session'), postHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:session', sessionObject);

  return response.status(200).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const expiredSession = await session.expireById(sessionObject.id);
  session.clearSessionIdCookie(response);

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:session', expiredSession);

  return response.status(200).json(secureOutputValues);
}

function postValidationHandler(request, response, next) {
  next();
}

async function postHandler(request, response) {
  const userTryingToCreateSession = request.context.user;
  const insecureInputValues = request.body;

  const secureInputValues = authorization.filterInput(userTryingToCreateSession, 'create:session', insecureInputValues);

  // 1° Validar o token recebido pelo front no google https://oauth2.googleapis.com/tokeninfo?id_token={token}
  // 2° Verificar se existe um usuário
  //    Caso exista prosseguir com o login
  //    Caso não exista criar um usuário com uma senha que nunca será acessível
  // 3° Continuar o fluxo do login passando o email normalmente

  let storedUser;
  let googleUserData;

  try {
    googleUserData = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${request.body.credentials.credential}`
    );
    if (googleUserData.status != 200) {
      throw new UnauthorizedError({
        message: `Dados não conferem.`,
        action: `Verifique se os dados enviados estão corretos.`,
        errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
      });
    }
    console.log(googleUserData);
  } catch (error) {
    throw new UnauthorizedError({
      message: `Dados não conferem.`,
      action: `Verifique se os dados enviados estão corretos.`,
      errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
    });
  }

  const { email } = googleUserData.data;

  try {
    console.log(googleUserData.data, email);
    storedUser = await user.findOneByEmailOrNull(email);
    if (!storedUser) {
      // Foi a forma mais facil que eu pensei mas pode ser melhorado
      await user.createGoogleAccount({
        email,
        password: 'password-null-from-google',
        username: email.split('@')[0].replace(/[^0-9a-z]/gi, ''),
      });
      await emailConfirmation.forceConfirmation(email);
      storedUser = await user.findOneByEmail(email);
      console.log(storedUser);
    }
  } catch (error) {
    console.log(error);
  }

  if (authorization.can(storedUser, 'read:activation_token')) {
    await emailConfirmation.forceConfirmation(email);
    storedUser = await user.findOneByEmail(email);
  }

  const sessionObject = await authentication.createSessionAndSetCookies(storedUser.id, response);

  const secureOutputValues = authorization.filterOutput(storedUser, 'create:session', sessionObject);

  return response.status(201).json(secureOutputValues);
}
