import { ValidationError, ForbiddenError } from 'errors/index.js';

const availableFeatures = new Set([
  'migration:read',
  'migration:create',

  'activation_token:read',

  'session:create',
  'session:read',

  'post:create',

  'comment:create',

  'user:create',
  'user:read',
  'user:read:email',
  'user:update',
  'user:update:others',

  'user_list:read',
]);

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {   
    authorized = true;
  }

  // TODO: Double check if this is right and covered by tests
  if (feature === 'user:update' && resource) {
    authorized = false;

    if (user.id === resource.id) {
      authorized = true;
    }

    if (user.id !== resource.id && can(user, 'user:update:others')) {
      authorized = true;
    }
  }
 
  return authorized;
}

function filterInput(user, feature, input) {
  validateUser(user);
  validateFeature(feature);
  validateInput(input);

  let filteredInputValues = {};

  if (feature === 'session:create' && can(user, feature)) {
    filteredInputValues = {
      username: input.username,
      password: input.password,
    };
  }

  if (feature === 'user:create' && can(user, feature)) {
    filteredInputValues = {
      username: input.username,
      email: input.email,
      password: input.password,
    };
  }

  if (feature === 'user:update' && can(user, feature)) {
    filteredInputValues = {
      username: input.username,
      email: input.email,
      password: input.password,
    };
  }

  return filteredInputValues;
}

function filterOutput(user, feature, output) {
  validateUser(user);
  validateFeature(feature);
  validateOutput(output);

  let filteredOutputValues = {};

  if (feature === 'session:read' && can(user, feature)) {
    if (user.id && output.user_id && user.id === output.user_id) {
      filteredOutputValues = {
        id: output.id,
        token: output.token,
        expires_at: output.expires_at,
        created_at: output.created_at,
        updated_at: output.updated_at,
      };
    }
  }

  if (feature === 'session:create' && can(user, feature)) {
    if (user.id && output.user_id && user.id === output.user_id) {
      filteredOutputValues = {
        id: output.id,
        token: output.token,
        expires_at: output.expires_at,
        created_at: output.created_at,
        updated_at: output.updated_at,
      };
    }
  }

  if (feature === 'user:read' && can(user, feature)) {
    filteredOutputValues = {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };

    if (user.id && output.id && user.id === output.id) {
      filteredOutputValues.email = output.email;
    }

    // TODO: Double check if this is right and covered by tests
    if (user.id !== output.id && can(user, 'user:read:email')) {
      filteredOutputValues.email = output.email;
    }
  }

  if (feature === 'user_list:read' && can(user, feature, output)) {
    filteredOutputValues = output.map((user) => ({
      id: user.id,
      username: user.username,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
  }

  return filteredOutputValues;
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
      message: `A feature utilizada não está disponível na lista de features existentes.`,
      action: `Contate o suporte informado o campo "errorId".`,
      context: {
        feature: feature,
      },
    });
  }
}

function validateInput(input) {
  if (!input) {
    throw new ValidationError({
      message: `Nenhum "input" foi especificado para a ação de filtro.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }
}

function validateOutput(output) {
  if (!output) {
    throw new ValidationError({
      message: `Nenhum "output" foi especificado para a ação de filtro.`,
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
        errorUniqueCode: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
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
