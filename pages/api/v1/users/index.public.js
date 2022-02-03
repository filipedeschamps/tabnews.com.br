import nextConnect from 'next-connect';
import { v4 as uuid } from 'uuid';
import user from 'models/user.js';
import { InternalServerError, NotFoundError } from '/errors';
import { ValidationError } from 'errors/index.js';

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
  const userList = await user.findAll();
  const responseBody = userList.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));

  return response.status(200).json(responseBody);
}

async function postHandler(request, response) {
  // TODO: extract properties from postedUserData
  const postedUserData = request.body;

  const newUser = await user.create(postedUserData);

  const responseBody = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  };

  return response.status(201).json(responseBody);
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.id });
  return response.status(errorObject.statusCode).json(errorObject);
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError) {
    // TODO: "requestId" and "errorId" should be snake case
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
