import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import recover from 'models/recover.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .post(postValidationHandler, postHandler)
  .patch(patchValidationHandler, patchHandler);

async function postHandler(request, response) {
  let user;
  try {
    user = await recover.findUserByUsernameOrEmail(request.body);
  } catch (error) {
    return response.status(error.statusCode).json(error);
  }
  await recover.createAndSendRecoveryEmail(user);
  return response.status(201).json(request.body);
}

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    username: 'optional',
    email: 'optional',
  });
  request.body = cleanValues;

  next();
}

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
    password: 'required',
  });

  request.body = cleanValues;

  next();
}

async function patchHandler(request, response) {
  const insecureInputValues = request.body;

  //TODO: validate input values with the new validation strategy
  let tokenObject;
  try {
    tokenObject = await recover.recoveryUserUsingTokenId(insecureInputValues.token_id);
  } catch (error) {
    return response.status(error.statusCode).json(error);
  }

  await recover.updatePassword(tokenObject.user_id, insecureInputValues.password);
  return response.status(200).send();
}
