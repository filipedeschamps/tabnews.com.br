import { createRouter } from 'next-connect';

import { ForbiddenError, UnauthorizedError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event';
import userTotp from 'models/user-totp';
import validator from 'models/validator';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .post(authorization.canRequest('read:session'), postValidationHandler, postHandler)
  .patch(authorization.canRequest('read:session'), patchValidationHandler, patchHandler)
  .delete(authorization.canRequest('read:session'), deleteValidationHandler, deleteHandler)
  .handler(controller.handlerOptions);

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanValues;

  return next();
}

async function postHandler(request, response) {
  validateIsSameUser(request);

  const authenticatedUser = request.context.user;

  const totp = await userTotp.startSetup(authenticatedUser);

  const output = {
    totp_url: totp.toString(),
  };
  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:totp', output);

  await event.create({
    type: 'totp:start_setup',
    originator_user_id: authenticatedUser.id,
    originator_ip: request.context.clientIp,
  });

  return response.status(201).json(secureOutputValues);
}

function patchValidationHandler(request, response, next) {
  const cleanQuery = validator(request.query, {
    username: 'required',
  });

  const cleanBody = validator(request.body, {
    totp_token: 'required',
  });

  request.query = cleanQuery;
  request.body = cleanBody;

  return next();
}

async function patchHandler(request, response) {
  validateIsSameUser(request);

  const authenticatedUser = request.context.user;

  await userTotp.enable(authenticatedUser, request.body.totp_token);

  const output = { totp_enabled: true };
  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:user_totp', output);

  await event.create({
    type: 'update:user',
    originator_user_id: authenticatedUser.id,
    originator_ip: request.context.clientIp,
    metadata: {
      id: authenticatedUser.id,
      updatedFields: ['totp_secret'],
      totp_enabled: { old: !!authenticatedUser.totp_secret, new: true },
    },
  });

  return response.status(200).json(secureOutputValues);
}

function deleteValidationHandler(request, response, next) {
  const cleanQuery = validator(request.query, {
    username: 'required',
  });

  const cleanBody = validator(request.body, {
    password: 'required',
    totp_token: 'required',
  });

  request.query = cleanQuery;
  request.body = cleanBody;

  return next();
}

async function deleteHandler(request, response) {
  validateIsSameUser(request);

  const authenticatedUser = request.context.user;

  // Compress all mismatch errors (TOTP token and password) into one single error.
  try {
    await authentication.comparePasswords(request.body.password, authenticatedUser.password);
    await userTotp.disable(authenticatedUser, request.body.totp_token);
  } catch (error) {
    throw new UnauthorizedError({
      message: `Dados não conferem.`,
      action: `Verifique se a senha e o código TOTP informados estão corretos.`,
      errorLocationCode: `CONTROLLER:USER_TOTP:DELETE_HANDLER:DATA_MISMATCH`,
    });
  }

  if (authenticatedUser.totp_secret) {
    await event.create({
      type: 'update:user',
      originator_user_id: authenticatedUser.id,
      originator_ip: request.context.clientIp,
      metadata: {
        id: authenticatedUser.id,
        updatedFields: ['totp_secret'],
        totp_enabled: { old: !!authenticatedUser.totp_secret, new: false },
      },
    });
  }

  return response.status(204).end();
}

function validateIsSameUser(request) {
  if (request.context.user.username !== request.query.username) {
    throw new ForbiddenError({
      message: 'Não é possível obter ou modificar o TOTP de outro usuário.',
      action: 'Altere o usuário na requisição.',
      errorLocationCode: 'CONTROLLER:USER_TOTP:VALIDATE_IS_SAME_USER',
    });
  }
}
