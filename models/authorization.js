import { ValidationError } from 'errors/index.js';

const availableFeatures = ['read:activation_token', 'create:session', 'read:session', 'create:post', 'create:comment'];

function can(user, feature, resourceObject) {
  let authorized = false;

  validateUser(user);
  validateFeature(feature);

  if (user.features.includes(feature)) {
    authorized = true;
  }

  // TODO: Implement double check of features
  // using resourceObject.

  return authorized;
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

  if (!availableFeatures.includes(feature)) {
    throw new ValidationError({
      message: `A "feature" enviada não está disponível na lista de features existentes.`,
      action: `Contate o suporte informado o campo "errorId".`,
    });
  }
}

export default Object.freeze({
  can,
});
