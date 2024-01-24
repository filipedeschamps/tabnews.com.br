import nextConnect from 'next-connect';

import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();
  const userDataFromDatabase = await user.findOneByUsername(request.query.username, {
    withBalance: false,
  });

  if (!userDataFromDatabase) {
    return response.status(404).json({
      message: `O usuário informado não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:USER:GET_HANDLER:USERNAME_NOT_FOUND',
      key: 'username',
    });
  }

  const userActivityFromDatabase = await user.getUserActivity(userDataFromDatabase.id);

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:user', userActivityFromDatabase);

  return response.status(200).json(secureOutputValues);
}
