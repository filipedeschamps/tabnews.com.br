import { ValidationError, ForbiddenError } from 'errors/index.js';

const availableFeatures = new Set([
  // USER
  'create:user',
  'read:user',
  'read:user:list',
  'update:user',
  'update:user:others_email',

  // MIGRATION
  'read:migration',
  'create:migration',

  // ACTIVATION_TOKEN
  'read:activation_token',

  // SESSION
  'create:session',
  'read:session',

  // POST
  'create:post',

  // COMMENT
  'create:comment',
]);

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  // TODO: Double check if this is right and covered by tests
  if (feature === 'update:user' && resource) {
    authorized = false;

    if (user.id === resource.id) {
      authorized = true;
    }

    if (user.id !== resource.id && can(user, 'update:user:others_email')) {
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

  if (feature === 'create:session' && can(user, feature)) {
    filteredInputValues = {
      email: input.email,
      password: input.password,
    };
  }

  if (feature === 'create:user' && can(user, feature)) {
    filteredInputValues = {
      username: input.username,
      email: input.email,
      password: input.password,
    };
  }

  if (feature === 'update:user' && can(user, feature)) {
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

  if (feature === 'read:session' && can(user, feature)) {
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

  if (feature === 'create:session' && can(user, feature)) {
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

  if (feature === 'read:user') {
    filteredOutputValues = {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  }

  if (feature === 'read:user:list') {
    filteredOutputValues = output.map((user) => ({
      id: user.id,
      username: user.username,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
  }

  if (feature === 'read:activation_token'){
    filteredOutputValues = {
      id: output.id,
      used: output.used,
      expires_at: output.expires_at,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
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
