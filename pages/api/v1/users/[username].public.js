import nextConnect from 'next-connect';
import { v4 as uuid } from 'uuid';
import userFactory from 'models/user.js';
import { InternalServerError, NotFoundError, ValidationError } from '/errors';

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(injectRequestId)
  .use(authenticationHandler)
  .use(authorizationHandler)
  .get(getHandler)
  .patch(patchHandler);

async function injectRequestId(request, response, next) {
  request.id = uuid();
  next();
}

async function authenticationHandler(request, response, next) {
  // TODO: implement authentication
  next();
}

async function authorizationHandler(request, response, next) {
  // TODO: implement authorization
  next();
}

async function getHandler(request, response) {
  const user = userFactory();

  const userObject = await user.findOneByUsername(request.query.username);

  const responseBody = {
    id: userObject.id,
    username: userObject.username,
    email: userObject.email,
    created_at: userObject.created_at,
    updated_at: userObject.updated_at,
  };

  return response.status(200).json(responseBody);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const postedUserData = request.body;

  const user = userFactory();
  const updatedUser = await user.update(username, postedUserData);

  const responseBody = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
  };

  return response.status(200).json(responseBody);
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.id });
  return response.status(errorObject.statusCode).json(errorObject);
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return response.status(error.statusCode).json({ ...error, requestId: request.id });
  }

  const errorObject = new InternalServerError({
    requestId: request.id,
    errorId: error.errorId,
    stack: error.stack,
  });

  console.error(errorObject);

  return response.status(errorObject.statusCode).json(errorObject);
}
