import nextConnect from 'next-connect';
import { v4 as uuid } from 'uuid';
import userFactory from 'models/user.js';
import { InternalServerError, NotFoundError, ValidationError } from '/errors';

const user = userFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(injectRequestId)
  .use(authenticationHandler)
  .use(authorizationHandler)
  .get(getHandler)
  .post(postHandler);

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
  const userObject = await user.findOneByUsername(request.query.username);
  return response.status(200).json(userObject);
}

async function postHandler(request, response) {
  const returnUser = await user.updateUser(request.query.id, request.body);
  return response.status(200).json(returnUser);
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
