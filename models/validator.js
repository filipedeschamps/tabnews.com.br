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
      errorLocationCode: 'MODEL:VALIDATOR:ERROR_PARSING_JSON',
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
      errorLocationCode: 'MODEL:VALIDATOR:FINAL_SCHEMA',
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

  owner_username: function () {
    return Joi.object({
      owner_username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .invalid(null)
        .when('$required.owner_username', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"owner_username" é um campo obrigatório.`,
          'string.empty': `"owner_username" não pode estar em branco.`,
          'string.base': `"owner_username" deve ser do tipo String.`,
          'string.alphanum': `"owner_username" deve conter apenas caracteres alfanuméricos.`,
          'string.min': `"owner_username" deve conter no mínimo {#limit} caracteres.`,
          'string.max': `"owner_username" deve conter no máximo {#limit} caracteres.`,
          'any.invalid': `"owner_username" possui o valor inválido "null".`,
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

  notifications: function () {
    return Joi.object({
      notifications: Joi.boolean()
        .invalid(null)
        .when('$required.notifications', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"notifications" é um campo obrigatório.`,
          'string.empty': `"notifications" não pode estar em branco.`,
          'boolean.base': `"notifications" deve ser do tipo Boolean.`,
          'any.invalid': `"notifications" possui o valor inválido "null".`,
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

  title: function () {
    return Joi.object({
      title: Joi.string()
        .replace(/^\u200e|\u200e$|^\u200f|\u200f$|\u0000/g, '')
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

  body: function () {
    return Joi.object({
      body: Joi.string()
        .replace(/^\u200e|\u200e$|^\u200f|\u200f$|\u0000/g, '')
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
        .allow(null)
        .replace(/\u0000/g, '')
        .trim()
        .max(2000)
        .pattern(/^https?:\/\/([-\p{Ll}\d_]{1,255}\.)+[-a-z0-9]{2,24}(:[0-9]{1,5})?([\/?#]\S*)?$/u)
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

  deleted_at: function () {
    return Joi.object({
      deleted_at: Joi.date()
        .allow(null)
        .when('$required.deleted_at', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"deleted_at" é um campo obrigatório.`,
          'string.empty': `"deleted_at" não pode estar em branco.`,
          'string.base': `"deleted_at" deve ser do tipo Date.`,
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

  page: function () {
    return Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .max(9007199254740990)
        .default(1)
        .when('$required.page', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"page" é um campo obrigatório.`,
          'string.empty': `"page" não pode estar em branco.`,
          'number.base': `"page" deve ser do tipo Number.`,
          'number.integer': `"page" deve ser um Inteiro.`,
          'number.min': `"page" deve possuir um valor mínimo de 1.`,
          'number.max': `"page" deve possuir um valor máximo de 9007199254740990.`,
          'number.unsafe': `"page" deve possuir um valor máximo de 9007199254740990.`,
        }),
    });
  },

  per_page: function () {
    return Joi.object({
      per_page: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(30)
        .when('$required.per_page', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"per_page" é um campo obrigatório.`,
          'string.empty': `"per_page" não pode estar em branco.`,
          'number.base': `"per_page" deve ser do tipo Number.`,
          'number.integer': `"per_page" deve ser um Inteiro.`,
          'number.min': `"per_page" deve possuir um valor mínimo de 1.`,
          'number.max': `"per_page" deve possuir um valor máximo de 100.`,
          'number.unsafe': `"per_page" deve possuir um valor máximo de 100.`,
        }),
    });
  },

  query: function () {
    return Joi.object({
      query: Joi.string()
        .allow('')
        .when('$required.query', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"query" é um campo obrigatório.`,
          'string.base': `"query" deve ser do tipo String.`,
        }),
    });
  },

  strategy: function () {
    return Joi.object({
      strategy: Joi.string()
        .trim()
        .valid('new', 'old', 'relevant')
        .default('relevant')
        .invalid(null)
        .when('$required.strategy', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"strategy" é um campo obrigatório.`,
          'string.empty': `"strategy" não pode estar em branco.`,
          'string.base': `"strategy" deve ser do tipo String.`,
          'any.invalid': `"strategy" possui o valor inválido "null".`,
          'any.only': `"strategy" deve possuir um dos seguintes valores: "new", "old" ou "relevant".`,
        }),
    });
  },

  like: function () {
    let likeSchema = Joi.object({}).optional().min(1).messages({
      'object.base': `"like" deve ser do tipo Object.`,
    });

    for (const key of ['title']) {
      const keyValidationFunction = schemas[key];
      likeSchema = likeSchema.concat(keyValidationFunction());
    }

    return Joi.object({
      like: likeSchema,
    });
  },

  // TODO: refactor this in the future for
  // an Array just like Sequelize.
  order: function () {
    return Joi.object({
      order: Joi.string()
        .trim()
        .valid('created_at DESC', 'created_at ASC', 'published_at DESC', 'published_at ASC')
        .when('$required.order', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"order" é um campo obrigatório.`,
          'string.empty': `"order" não pode estar em branco.`,
          'string.base': `"order" deve ser do tipo String.`,
          'any.only': `"order" deve possuir um dos seguintes valores: "created_at DESC", "created_at ASC", "published_at DESC" ou "published_at ASC".`,
        }),
    });
  },

  where: function () {
    let whereSchema = Joi.object({}).optional().min(1).messages({
      'object.base': `"where" deve ser do tipo Object.`,
    });

    for (const key of [
      'id',
      'parent_id',
      'slug',
      'title',
      'body',
      'status',
      'source_url',
      'owner_id',
      'username',
      'owner_username',
      'like',
      '$or',
      'attributes',
    ]) {
      const keyValidationFunction = schemas[key];
      whereSchema = whereSchema.concat(keyValidationFunction());
    }

    return Joi.object({
      where: whereSchema,
    });
  },

  limit: function () {
    return Joi.object({
      limit: Joi.number()
        .integer()
        .min(1)
        .max(9007199254740990)
        .default(null)
        .when('$required.limit', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"limit" é um campo obrigatório.`,
          'string.empty': `"limit" não pode estar em branco.`,
          'number.base': `"limit" deve ser do tipo Number.`,
          'number.integer': `"limit" deve ser um Inteiro.`,
          'number.min': `"limit" deve possuir um valor mínimo de 1.`,
          'number.max': `"limit" deve possuir um valor máximo de 9007199254740990.`,
          'number.unsafe': `"limit" deve possuir um valor máximo de 9007199254740990.`,
        }),
    });
  },

  $or: function () {
    const statusSchemaWithId = schemas.status().id('status');

    return Joi.object({
      $or: Joi.array()
        .optional()
        .items(Joi.link('#status'))
        .messages({
          'array.base': `"#or" deve ser do tipo Array.`,
        })
        .shared(statusSchemaWithId),
    });
  },

  attributes: function () {
    return Joi.object({
      attributes: Joi.object({
        exclude: Joi.array().items(Joi.string().valid('body')),
      }),
    });
  },

  count: function () {
    return Joi.object({
      count: Joi.boolean()
        .default(false)
        .when('$required.count', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"count" é um campo obrigatório.`,
          'string.empty': `"count" não pode estar em branco.`,
          'boolean.base': `"count" deve ser do tipo Boolean.`,
        }),
    });
  },

  children_deep_count: function () {
    return Joi.object({
      children_deep_count: Joi.number()
        .when('$required.children_deep_count', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"children_deep_count" é um campo obrigatório.`,
          'number.integer': `"children_deep_count" deve ser um Inteiro.`,
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
      'deleted_at',
      'owner_username',
      'children_deep_count',
      'tabcoins',
    ]) {
      const keyValidationFunction = schemas[key];
      contentSchema = contentSchema.concat(keyValidationFunction());
    }

    return contentSchema;
  },

  event: function () {
    return Joi.object({
      type: Joi.string()
        .valid(
          'create:user',
          'ban:user',
          'create:content:text_root',
          'create:content:text_child',
          'update:content:text_root',
          'update:content:text_child',
          'update:content:tabcoins',
          'firewall:block_users',
          'firewall:block_contents:text_root',
          'firewall:block_contents:text_child',
          'system:update:tabcoins'
        )
        .messages({
          'any.required': `"type" é um campo obrigatório.`,
          'string.empty': `"type" não pode estar em branco.`,
          'string.base': `"type" deve ser do tipo String.`,
          'any.only': `"type" não possui um valor válido.`,
        }),
      originatorUserId: Joi.string().guid({ version: 'uuidv4' }).optional().messages({
        'string.empty': `"originatorId" não pode estar em branco.`,
        'string.base': `"originatorId" deve ser do tipo String.`,
        'string.guid': `"originatorId" deve possuir um token UUID na versão 4.`,
      }),
      originatorIp: Joi.string()
        .ip({
          version: ['ipv4', 'ipv6'],
        })
        .optional()
        .messages({
          'string.empty': `"originatorIp" não pode estar em branco.`,
          'string.base': `"originatorIp" deve ser do tipo String.`,
          'string.ip': `"originatorIp" deve possuir um IP válido`,
        }),
      metadata: Joi.when('type', [
        {
          is: 'create:user',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'create:content:text_root',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'create:content:text_child',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'update:content:text_root',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'update:content:text_child',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'firewall:block_users',
          then: Joi.object({
            from_rule: Joi.string().required(),
            users: Joi.array().required(),
          }),
        },
        {
          is: 'firewall:block_contents:text_root',
          then: Joi.object({
            from_rule: Joi.string().required(),
            contents: Joi.array().required(),
          }),
        },
        {
          is: 'firewall:block_contents:text_child',
          then: Joi.object({
            from_rule: Joi.string().required(),
            contents: Joi.array().required(),
          }),
        },
      ]),
    });
  },

  tabcoins: function () {
    return Joi.object({
      tabcoins: Joi.number()
        .integer()
        .min(-2147483648)
        .max(2147483647)
        .when('$required.tabcoins', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"tabcoins" é um campo obrigatório.`,
          'string.empty': `"tabcoins" não pode estar em branco.`,
          'number.base': `"tabcoins" deve ser do tipo Number.`,
          'number.integer': `"tabcoins" deve ser um Inteiro.`,
          'number.min': `"tabcoins" deve possuir um valor mínimo de -2147483648.`,
          'number.max': `"tabcoins" deve possuir um valor máximo de 2147483647.`,
          'number.unsafe': `"tabcoins" deve possuir um valor máximo de 2147483647.`,
        }),
    });
  },

  tabcash: function () {
    return Joi.object({
      tabcash: Joi.number()
        .integer()
        .min(-2147483648)
        .max(2147483647)
        .when('$required.tabcash', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"tabcash" é um campo obrigatório.`,
          'string.empty': `"tabcash" não pode estar em branco.`,
          'number.base': `"tabcash" deve ser do tipo Number.`,
          'number.integer': `"tabcash" deve ser um Inteiro.`,
          'number.min': `"tabcash" deve possuir um valor mínimo de -2147483648.`,
          'number.max': `"tabcash" deve possuir um valor máximo de 2147483647.`,
          'number.unsafe': `"tabcash" deve possuir um valor máximo de 2147483647.`,
        }),
    });
  },

  transaction_type: function () {
    return Joi.object({
      transaction_type: Joi.string()
        .trim()
        .valid('credit', 'debit')
        .invalid(null)
        .when('$required.transaction_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"transaction_type" é um campo obrigatório.`,
          'string.empty': `"transaction_type" não pode estar em branco.`,
          'string.base': `"transaction_type" deve ser do tipo String.`,
          'any.invalid': `"transaction_type" possui o valor inválido "null".`,
          'any.only': `"transaction_type" deve possuir um dos seguintes valores: "credit" e "debit".`,
        }),
    });
  },

  ban_type: function () {
    return Joi.object({
      ban_type: Joi.string()
        .trim()
        .valid('nuke')
        .invalid(null)
        .when('$required.ban_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'any.required': `"ban_type" é um campo obrigatório.`,
          'string.empty': `"ban_type" não pode estar em branco.`,
          'string.base': `"ban_type" deve ser do tipo String.`,
          'any.invalid': `"ban_type" possui o valor inválido "null".`,
          'any.only': `"ban_type" deve possuir um dos seguintes valores: "nuke".`,
        }),
    });
  },
};
