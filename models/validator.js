import Joi from 'joi';
import { ValidationError } from 'errors/index.js';

export default function validator(object, keys) {
  // Force the clean up of "undefined" values since JSON
  // doesn't support them and Joi doesn't clean
  // them up. Also handles the case where the
  // "object" is not a valid JSON.
  try {
    object = JSON.parse(JSON.stringify(object));
  } catch (error) {
    throw new ValidationError({
      message: 'Não foi possível interpretar o valor enviado.',
      action: 'Verifique se o valor enviado é um JSON válido.',
      errorUniqueCode: 'MODEL:VALIDATOR:ERROR_PARSING_JSON',
      stack: new Error().stack,
      key: 'object',
    });
  }

  let finalSchema = Joi.object().required().min(1).messages({
    'object.base': `Body enviado deve ser do tipo Object.`,
    'object.min': `Objeto enviado deve ter no mínimo uma chave.`,
  });

  for (const key of Object.keys(keys)) {
    const keyValidationFunction = schemas[key];
    finalSchema = finalSchema.concat(keyValidationFunction());
  }

  const { error, value } = finalSchema.validate(object, {
    escapeHtml: true,
    stripUnknown: true,
    context: {
      required: keys,
    },
  });

  if (error) {
    throw new ValidationError({
      message: error.details[0].message,
      key: error.details[0].context.key || error.details[0].context.type || 'object',
      errorUniqueCode: 'MODEL:VALIDATOR:FINAL_SCHEMA',
      stack: new Error().stack,
    });
  }

  return value;
}

const schemas = {
  username: function () {
    return Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .invalid(null)
        .when('$required.username', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"username" é um campo obrigatório.`,
          'string.empty': `"username" não pode estar em branco.`,
          'string.base': `"username" deve ser do tipo String.`,
          'string.alphanum': `"username" deve conter apenas caracteres alfanuméricos.`,
          'string.min': `"username" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"username" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"username" possui o valor inválido "null".`,
        }),
    });
  },

  email: function () {
    return Joi.object({
      email: Joi.string()
        .email()
        .min(7)
        .max(254)
        .lowercase()
        .trim()
        .invalid(null)
        .when('$required.email', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"email" é um campo obrigatório.`,
          'string.empty': `"email" não pode estar em branco.`,
          'string.base': `"email" deve ser do tipo String.`,
          'string.email': `"email" deve conter um email válido.`,
          'any.invalid': `"email" possui o valor inválido "null".`,
        }),
    });
  },

  password: function () {
    return Joi.object({
      // Why 72 in max length? https://security.stackexchange.com/a/39851
      password: Joi.string()
        .min(8)
        .max(72)
        .trim()
        .invalid(null)
        .when('$required.password', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"password" é um campo obrigatório.`,
          'string.empty': `"password" não pode estar em branco.`,
          'string.base': `"password" deve ser do tipo String.`,
          'string.min': `"password" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"password" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"password" possui o valor inválido "null".`,
        }),
    });
  },

  token_id: function () {
    return Joi.object({
      token_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.token_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"token_id" é um campo obrigatório.`,
          'string.empty': `"token_id" não pode estar em branco.`,
          'string.base': `"token_id" deve ser do tipo String.`,
          'string.guid': `"token_id" deve possuir um token UUID na versão 4.`,
        }),
    });
  },

  session_id: function () {
    return Joi.object({
      session_id: Joi.string()
        .length(96)
        .alphanum()
        .when('$required.session_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"session_id" é um campo obrigatório.`,
          'string.empty': `"session_id" não pode estar em branco.`,
          'string.base': `"session_id" deve ser do tipo String.`,
          'string.length': `"session_id" deve possuir {#limit} caracteres.`,
          'string.alphanum': `"session_id" deve conter apenas caracteres alfanuméricos.`,
        }),
    });
  },

  parent_id: function () {
    return Joi.object({
      parent_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.parent_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"parent_id" é um campo obrigatório.`,
          'string.empty': `"parent_id" não pode estar em branco.`,
          'string.base': `"parent_id" deve ser do tipo String.`,
          'string.guid': `"parent_id" deve possuir um token UUID na versão 4.`,
        }),
    });
  },

  owner_id: function () {
    return Joi.object({
      owner_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.owner_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"owner_id" é um campo obrigatório.`,
          'string.empty': `"owner_id" não pode estar em branco.`,
          'string.base': `"owner_id" deve ser do tipo String.`,
          'string.guid': `"owner_id" deve possuir um token UUID na versão 4.`,
        }),
    });
  },

  slug: function () {
    return Joi.object({
      slug: Joi.string()
        .min(1)
        .max(256)
        .trim()
        .invalid(null)
        .pattern(/^[a-z0-9](-?[a-z0-9])*$/m)
        .when('$required.slug', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"slug" é um campo obrigatório.`,
          'string.empty': `"slug" não pode estar em branco.`,
          'string.base': `"slug" deve ser do tipo String.`,
          'string.min': `"slug" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"slug" deve conter no máximo {#limit} caracteres.`,
          'string.pattern.base': `"slug" está no formato errado.`,
          'any.invalid': `"slug" possui o valor inválido "null".`,
        }),
    });
  },

  title: function () {
    return Joi.object({
      title: Joi.string()
        .min(1)
        .max(256)
        .trim()
        .invalid(null)
        .when('$required.title', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"title" é um campo obrigatório.`,
          'string.empty': `"title" não pode estar em branco.`,
          'string.base': `"title" deve ser do tipo String.`,
          'string.min': `"title" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"title" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"title" possui o valor inválido "null".`,
        }),
    });
  },

  body: function () {
    return Joi.object({
      body: Joi.string()
        .min(1)
        .max(20000)
        .trim()
        .invalid(null)
        .when('$required.body', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"body" é um campo obrigatório.`,
          'string.empty': `"body" não pode estar em branco.`,
          'string.base': `"body" deve ser do tipo String.`,
          'string.min': `"body" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"body" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"body" possui o valor inválido "null".`,
        }),
    });
  },

  status: function () {
    return Joi.object({
      status: Joi.string()
        .trim()
        .valid('draft', 'published', 'deleted')
        .invalid(null)
        .when('$required.status', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"status" é um campo obrigatório.`,
          'string.empty': `"status" não pode estar em branco.`,
          'string.base': `"status" deve ser do tipo String.`,
          'string.min': `"status" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"status" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"status" possui o valor inválido "null".`,
          'any.only': `"status" deve possuir um dos seguintes valores: "draft", "published" ou "deleted".`,
        }),
    });
  },

  source_url: function () {
    return Joi.object({
      source_url: Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .invalid(null)
        .when('$required.source_url', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"source_url" é um campo obrigatório.`,
          'string.empty': `"source_url" não pode estar em branco.`,
          'string.base': `"source_url" deve ser do tipo String.`,
          'string.min': `"source_url" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"source_url" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"source_url" possui o valor inválido "null".`,
          'string.uri': `"source_url" deve possuir uma URL válida.`,
          'string.uriCustomScheme': `"source_url" deve possuir um dos seguintes protocolos: "http" ou "https".`,
        }),
    });
  },
};
