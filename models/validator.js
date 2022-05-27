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
      type: error.details[0].type,
    });
  }

  return value;
}

const schemas = {
  id: function () {
    return Joi.object({
      id: Joi.string()
        .allow(null)
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"id" é um campo obrigatório.`,
          'string.empty': `"id" não pode estar em branco.`,
          'string.base': `"id" deve ser do tipo String.`,
          'string.guid': `"id" deve possuir um token UUID na versão 4.`,
        }),
    });
  },

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

  parent_username: function () {
    return Joi.object({
      parent_username: Joi.string()
        .allow(null)
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .when('$required.parent_username', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"parent_username" é um campo obrigatório.`,
          'string.empty': `"parent_username" não pode estar em branco.`,
          'string.base': `"parent_username" deve ser do tipo String.`,
          'string.alphanum': `"parent_username" deve conter apenas caracteres alfanuméricos.`,
          'string.min': `"parent_username" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"parent_username" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"parent_username" possui o valor inválido "null".`,
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
        .allow(null)
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

  parent_slug: function () {
    return Joi.object({
      parent_slug: Joi.string()
        .allow(null)
        .min(1)
        .max(256)
        .trim()
        .pattern(/^[a-z0-9](-?[a-z0-9])*$/m)
        .when('$required.parent_slug', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"parent_slug" é um campo obrigatório.`,
          'string.empty': `"parent_slug" não pode estar em branco.`,
          'string.base': `"parent_slug" deve ser do tipo String.`,
          'string.min': `"parent_slug" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"parent_slug" deve conter no máximo {#limit} caracteres.`,
          'string.pattern.base': `"parent_slug" está no formato errado.`,
          'any.invalid': `"parent_slug" possui o valor inválido "null".`,
        }),
    });
  },

  title: function () {
    return Joi.object({
      title: Joi.string()
        .allow(null)
        .min(1)
        .max(256)
        .trim()
        .when('$required.title', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"title" é um campo obrigatório.`,
          'string.empty': `"title" não pode estar em branco.`,
          'string.base': `"title" deve ser do tipo String.`,
          'string.min': `"title" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"title" deve conter no máximo {#limit} caracteres.`,
        }),
    });
  },

  parent_title: function () {
    return Joi.object({
      parent_title: Joi.string()
        .allow(null)
        .min(1)
        .max(256)
        .trim()
        .when('$required.parent_title', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"parent_title" é um campo obrigatório.`,
          'string.empty': `"parent_title" não pode estar em branco.`,
          'string.base': `"parent_title" deve ser do tipo String.`,
          'string.min': `"parent_title" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"parent_title" deve conter no máximo {#limit} caracteres.`,
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
        .valid('draft', 'published')
        .invalid(null)
        .when('$required.status', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"status" é um campo obrigatório.`,
          'string.empty': `"status" não pode estar em branco.`,
          'string.base': `"status" deve ser do tipo String.`,
          'string.min': `"status" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"status" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"status" possui o valor inválido "null".`,
          'any.only': `"status" deve possuir um dos seguintes valores: "draft" ou "published".`,
        }),
    });
  },

  source_url: function () {
    return Joi.object({
      source_url: Joi.string()
        .allow(null)
        .trim()
        .max(2000)
        .pattern(/^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)
        .when('$required.source_url', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"source_url" é um campo obrigatório.`,
          'string.empty': `"source_url" não pode estar em branco.`,
          'string.base': `"source_url" deve ser do tipo String.`,
          'string.max': `"source_url" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"source_url" possui o valor inválido "null".`,
          'string.pattern.base': `"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.`,
        }),
    });
  },

  owner_id: function () {
    return Joi.object({
      owner_id: Joi.string()
        .allow(null)
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

  created_at: function () {
    return Joi.object({
      created_at: Joi.date()
        .when('$required.created_at', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"created_at" é um campo obrigatório.`,
          'string.empty': `"created_at" não pode estar em branco.`,
          'string.base': `"created_at" deve ser do tipo Date.`,
        }),
    });
  },

  updated_at: function () {
    return Joi.object({
      updated_at: Joi.date()
        .when('$required.updated_at', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"updated_at" é um campo obrigatório.`,
          'string.empty': `"updated_at" não pode estar em branco.`,
          'string.base': `"updated_at" deve ser do tipo Date.`,
        }),
    });
  },

  published_at: function () {
    return Joi.object({
      published_at: Joi.date()
        .allow(null)
        .when('$required.published_at', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"published_at" é um campo obrigatório.`,
          'string.empty': `"published_at" não pode estar em branco.`,
          'string.base': `"published_at" deve ser do tipo Date.`,
        }),
    });
  },

  expires_at: function () {
    return Joi.object({
      expires_at: Joi.date()
        .allow(null)
        .when('$required.expires_at', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"expires_at" é um campo obrigatório.`,
          'string.empty': `"expires_at" não pode estar em branco.`,
          'string.base': `"expires_at" deve ser do tipo Date.`,
        }),
    });
  },

  used: function () {
    return Joi.object({
      used: Joi.boolean()
        .allow(false)
        .when('$required.used', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"used" é um campo obrigatório.`,
          'string.empty': `"used" não pode estar em branco.`,
          'boolean.base': `"used" deve ser do tipo Boolean.`,
        }),
    });
  },

  content: function () {
    let contentSchema = Joi.object({
      children: Joi.array().optional().items(Joi.link('#content')).messages({
        'array.base': `"children" deve ser do tipo Array.`,
      }),
    })
      .required()
      .min(1)
      .messages({
        'object.base': `Body deve ser do tipo Object.`,
      })
      .id('content');

    for (const key of [
      'id',
      'owner_id',
      'parent_id',
      'slug',
      'title',
      'body',
      'status',
      'source_url',
      'created_at',
      'updated_at',
      'published_at',
      'username',
      'parent_title',
      'parent_slug',
      'parent_username',
    ]) {
      const keyValidationFunction = schemas[key];
      contentSchema = contentSchema.concat(keyValidationFunction());
    }

    return contentSchema;
  },
};
