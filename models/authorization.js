import { ValidationError, ForbiddenError } from 'errors/index.js';

const availableFeatures = new Set([
  'read:activation_token',

  'create:session',
  'read:session',

  'create:post',
  'create:comment',

  'read:user',
]);

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  // TODO: Implement double check of features
  // using resource.

  return authorized;
}

function filterInput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  let filteredValues = {};

  if (feature === 'create:session' && can(user, feature, resource)) {
    filteredValues = {
      username: resource.username,
      password: resource.password,
    };
  }

  return filteredValues;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  let filteredValues = {};

  if (feature === 'read:session' && can(user, feature, resource)) {
    if (user.id && resource.user_id && user.id === resource.user_id) {
      filteredValues = {
        id: resource.id,
        token: resource.token,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === 'create:session' && can(user, feature, resource)) {
    if (user.id && resource.user_id && user.id === resource.user_id) {
      filteredValues = {
        id: resource.id,
        token: resource.token,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === 'read:user' && can(user, feature, resource)) {
    filteredValues = {
      id: resource.id,
      username: resource.username,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };

    if (user.id && resource.id && user.id === resource.id) {
      filteredValues.email = resource.email;
    }
  }

  return filteredValues;
}

function validateUser(user) {
  if (!user) {
    throw new ValidationError({
      message: `Nenhum "user" foi especificado para a ação de autorização.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }

  if (!user.features || !Array.isArray(user.features)) {
    throw new ValidationError({
      message: `"user" não possui "features" ou não é um array.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }
}

function validateFeature(feature) {
  if (!feature) {
    throw new ValidationError({
      message: `Nenhuma "feature" foi especificada para a ação de autorização.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }

  if (!availableFeatures.has(feature)) {
    throw new ValidationError({
      message: `A "feature" enviada não está disponível na lista de features existentes.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new ValidationError({
      message: `Nenhum "resource" foi especificado para a ação de filtro.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }
}

function canRequest(feature) {
  return function (request, response, next) {
    const userTryingToRequest = request.context.user;

    if (!can(userTryingToRequest, feature)) {
      throw new ForbiddenError({
        message: `Usuário não pode executar esta operação.`,
        action: `Verifique se este usuário possui a feature "${feature}".`,
      });
    }

    next();
  };
}

export default Object.freeze({
  can,
  canRequest,
  filterOutput,
  filterInput,
});
