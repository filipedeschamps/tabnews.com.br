import Joi from 'joi';

import { ValidationError } from 'errors';
import webserver from 'infra/webserver';
import removeMarkdown, { trimEnd, trimStart } from 'models/remove-markdown';
import availableFeatures from 'models/user-features';

const MAX_INTEGER = 2147483647;
const MIN_INTEGER = -2147483648;

const cachedSchemas = {};

const defaultSchema = Joi.object()
  .label('body')
  .required()
  .min(1)
  .messages({
    'any.invalid': '{#label} possui o valor inválido "{#value}".',
    'any.only': '{#label} deve possuir um dos seguintes valores: {#valids}.',
    'any.required': '{#label} é um campo obrigatório.',
    'array.base': '{#label} deve ser do tipo Array.',
    'array.min': `{#label} deve possuir ao menos {#limit} {if(#limit==1, "elemento", "elementos")}.`,
    'boolean.base': '{#label} deve ser do tipo Boolean.',
    'date.base': '{#label} deve conter uma data válida.',
    'markdown.empty': 'Markdown deve conter algum texto.',
    'number.base': '{#label} deve ser do tipo Number.',
    'number.integer': '{#label} deve ser um Inteiro.',
    'number.max': '{#label} deve possuir um valor máximo de {#limit}.',
    'number.min': '{#label} deve possuir um valor mínimo de {#limit}.',
    'number.unsafe': `{#label} deve possuir um valor entre ${MIN_INTEGER} e ${MAX_INTEGER}.`,
    'object.base': '{#label} enviado deve ser do tipo Object.',
    'object.min': 'Objeto enviado deve ter no mínimo uma chave.',
    'string.alphanum': '{#label} deve conter apenas caracteres alfanuméricos.',
    'string.base': '{#label} deve ser do tipo String.',
    'string.email': '{#label} deve conter um email válido.',
    'string.empty': '{#label} não pode estar em branco.',
    'string.length': '{#label} deve possuir {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    'string.ip': '{#label} deve possuir um IP válido.',
    'string.guid': '{#label} deve possuir um token UUID na versão 4.',
    'string.max': '{#label} deve conter no máximo {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    'string.min': '{#label} deve conter no mínimo {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    'username.reserved': 'Este nome de usuário não está disponível para uso.',
    'string.pattern.base': '{#label} está no formato errado.',
  });

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

  const keysString = Object.keys(keys).join(',');

  if (!cachedSchemas[keysString]) {
    let finalSchema = defaultSchema;

    for (const key of Object.keys(keys)) {
      const keyValidationFunction = schemas[key];
      finalSchema = finalSchema.concat(keyValidationFunction());
    }
    cachedSchemas[keysString] = finalSchema;
  }

  const { error, value } = cachedSchemas[keysString].validate(object, {
    stripUnknown: true,
    context: {
      required: keys,
    },
    errors: {
      escapeHtml: true,
      wrap: {
        array: false,
        string: '"',
      },
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
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.id', { is: 'required', then: Joi.required(), otherwise: Joi.optional().allow(null) }),
    });
  },

  username: function () {
    return Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .custom(checkReservedUsernames, 'check if username is reserved')
        .when('$required.username', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  owner_username: function () {
    return Joi.object({
      owner_username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .custom(checkReservedUsernames, 'check if username is reserved')
        .when('$required.owner_username', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
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
        .when('$required.email', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  password: function () {
    return Joi.object({
      // Why 72 in max length? https://security.stackexchange.com/a/39851
      password: Joi.string()
        .min(8)
        .max(72)
        .trim()
        .when('$required.password', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  description: function () {
    return Joi.object({
      description: Joi.string()
        .max(5000)
        .replace(/\u0000/gu, '')
        .custom(trimEnd)
        .allow('')
        .when('$required.description', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  features: function () {
    return Joi.object({
      features: Joi.array()
        .when('$required.features', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .items(Joi.string().valid(...availableFeatures))
        .messages({
          'any.only': '{#label} não aceita o valor "{#value}".',
        }),
    });
  },

  notifications: function () {
    return Joi.object({
      notifications: Joi.boolean().when('$required.notifications', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  token_id: function () {
    return Joi.object({
      token_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.token_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  session_id: function () {
    return Joi.object({
      session_id: Joi.string()
        .length(96)
        .alphanum()
        .when('$required.session_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  parent_id: function () {
    return Joi.object({
      parent_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.parent_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional().allow(null) }),
    });
  },

  slug: function () {
    return Joi.object({
      slug: Joi.string()
        .min(1)
        .max(160, 'utf8')
        .trim()
        .truncate()
        .custom(noTrailingHyphen)
        .pattern(/^[a-z0-9](-?[a-z0-9])*$/)
        .when('$required.slug', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  title: function () {
    return Joi.object({
      title: Joi.string()
        .min(1)
        .max(255)
        .replace(/\u0000/gu, '')
        .custom(trimStart)
        .custom(trimEnd)
        .when('$required.title', { is: 'required', then: Joi.required(), otherwise: Joi.optional().allow(null) }),
    });
  },

  body: function () {
    return Joi.object({
      body: Joi.string()
        .pattern(/^[\s\p{C}\u034f\u17b4\u17b5\u2800\u115f\u1160\u3164\uffa0].*$/su, { invert: true })
        .min(1)
        .max(20000)
        .replace(/\u0000/gu, '')
        .custom(trimEnd)
        .custom(withoutMarkdown, 'check if is empty without markdown')
        .when('$required.body', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'string.pattern.invert.base': `{#label} deve começar com caracteres visíveis.`,
        }),
    });
  },

  status: function () {
    return Joi.object({
      status: Joi.string()
        .trim()
        .valid('draft', 'published', 'deleted', 'firewall')
        .when('$required.status', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  content_type: function () {
    return Joi.object({
      type: Joi.string()
        .trim()
        .valid('content', 'ad')
        .default('content')
        .when('$required.content_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  source_url: function () {
    return Joi.object({
      source_url: Joi.string()
        .replace(/\u0000/g, '')
        .trim()
        .max(2000)
        .pattern(/^https?:\/\/([-\p{Ll}\d_]{1,255}\.)+[-a-z0-9]{2,24}(:[0-9]{1,5})?([/?#]\S*)?$/u)
        .when('$required.source_url', { is: 'required', then: Joi.required(), otherwise: Joi.optional().allow(null) })
        .messages({
          'string.pattern.base': `{#label} deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.`,
        }),
    });
  },

  owner_id: function () {
    return Joi.object({
      owner_id: Joi.string()
        .trim()
        .guid({ version: 'uuidv4' })
        .when('$required.owner_id', { is: 'required', then: Joi.required(), otherwise: Joi.optional().allow(null) }),
    });
  },

  created_at: function () {
    return Joi.object({
      created_at: Joi.date().when('$required.created_at', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  updated_at: function () {
    return Joi.object({
      updated_at: Joi.date().when('$required.updated_at', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  published_at: function () {
    return Joi.object({
      published_at: Joi.date().when('$required.published_at', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
      }),
    });
  },

  deleted_at: function () {
    return Joi.object({
      deleted_at: Joi.date().when('$required.deleted_at', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
      }),
    });
  },

  expires_at: function () {
    return Joi.object({
      expires_at: Joi.date().when('$required.expires_at', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
      }),
    });
  },

  used: function () {
    return Joi.object({
      used: Joi.boolean().when('$required.used', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  page: function () {
    const min = 1;
    const max = 9007199254740990;
    return Joi.object({
      page: Joi.number()
        .integer()
        .min(min)
        .max(max)
        .default(1)
        .when('$required.page', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'number.unsafe': `{#label} deve possuir um valor entre ${min} e ${max}.`,
        }),
    });
  },

  per_page: function () {
    const min = 1;
    const max = 100;
    return Joi.object({
      per_page: Joi.number()
        .integer()
        .min(min)
        .max(max)
        .default(30)
        .when('$required.per_page', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'number.unsafe': `{#label} deve possuir um valor entre ${min} e ${max}.`,
        }),
    });
  },

  strategy: function () {
    return Joi.object({
      strategy: Joi.string()
        .trim()
        .valid('new', 'old', 'relevant')
        .default('relevant')
        .when('$required.strategy', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  // TODO: refactor this in the future for
  // an Array just like Sequelize.
  order: function () {
    return Joi.object({
      order: Joi.string()
        .trim()
        .valid('created_at DESC', 'created_at ASC', 'published_at DESC', 'published_at ASC')
        .when('$required.order', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  ignore_id: function () {
    return Joi.object({
      ignore_id: schemas.id().extract('id'),
    });
  },

  flexible: function () {
    return Joi.object({
      flexible: Joi.boolean()
        .default(false)
        .when('$required.optional', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  where: function () {
    let whereSchema = Joi.object({}).optional().min(1);

    for (const key of [
      'parent_id',
      'slug',
      'title',
      'body',
      'source_url',
      'owner_id',
      'username',
      'owner_username',
      '$not_null',
      'attributes',
    ]) {
      const keyValidationFunction = schemas[key];
      whereSchema = whereSchema.concat(keyValidationFunction());
    }

    for (const key of ['id', 'status']) {
      whereSchema = whereSchema.concat(
        Joi.object({
          [key]: Joi.alternatives().try(Joi.array().items(schemas[key]().extract(key)), schemas[key]().extract(key)),
        }),
      );
    }

    whereSchema = whereSchema.concat(
      Joi.object({
        type: Joi.alternatives().try(
          Joi.array().items(schemas.content_type().extract('type')),
          schemas.content_type().extract('type'),
        ),
      }),
    );

    return Joi.object({
      where: whereSchema,
    });
  },

  limit: function () {
    const min = 1;
    const max = 9007199254740990;
    return Joi.object({
      limit: Joi.number()
        .integer()
        .min(min)
        .max(max)
        .default(null)
        .when('$required.limit', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'number.unsafe': `{#label} deve possuir um valor entre ${min} e ${max}.`,
        }),
    });
  },

  $not_null: function () {
    return Joi.object({
      $not_null: Joi.array().optional().items(Joi.string().valid('parent_id')),
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
        .when('$required.count', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  children_deep_count: function () {
    return Joi.object({
      children_deep_count: Joi.number().when('$required.children_deep_count', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  content: function () {
    let contentSchema = Joi.object({
      children: Joi.array().optional().items(Joi.link('#content')),
    })
      .required()
      .min(1)
      .id('content');

    for (const key of [
      'id',
      'owner_id',
      'parent_id',
      'slug',
      'title',
      'body',
      'status',
      'content_type',
      'source_url',
      'created_at',
      'updated_at',
      'published_at',
      'deleted_at',
      'owner_username',
      'children_deep_count',
      'tabcoins',
      'tabcoins_credit',
      'tabcoins_debit',
      'tabcash',
    ]) {
      const keyValidationFunction = schemas[key];
      contentSchema = contentSchema.concat(keyValidationFunction());
    }

    return contentSchema;
  },

  ad: function () {
    let contentSchema = Joi.object({
      children: Joi.array().optional().items(Joi.link('#content')),
    })
      .required()
      .min(1)
      .id('ad');

    for (const key of [
      'id',
      'owner_id',
      'slug',
      'title',
      'body',
      'status',
      'ad_type',
      'source_url',
      'created_at',
      'updated_at',
      'published_at',
      'deleted_at',
      'owner_username',
      'children_deep_count',
      'tabcash',
    ]) {
      const keyValidationFunction = schemas[key];
      contentSchema = contentSchema.concat(keyValidationFunction());
    }

    return contentSchema;
  },

  ad_list: function () {
    return Joi.object({
      ad_list: Joi.array().items(Joi.link('#ad')).required().shared(schemas.ad()),
    });
  },

  ad_type: function () {
    return Joi.object({
      type: Joi.string()
        .trim()
        .valid('markdown')
        .default('markdown')
        .when('$required.ad_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  with_children: function () {
    return Joi.object({
      with_children: Joi.boolean().when('$required.with_children', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  with_root: function () {
    return Joi.object({
      with_root: Joi.boolean().when('$required.with_root', {
        is: 'required',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  event: function () {
    return Joi.object({
      id: schemas.id().extract('id'),
      created_at: schemas.created_at().extract('created_at'),
      type: Joi.string()
        .valid(
          'create:user',
          'update:user',
          'ban:user',
          'create:content:text_root',
          'create:content:text_child',
          'update:content:text_root',
          'update:content:text_child',
          'update:content:tabcoins',
          'firewall:block_users',
          'firewall:block_contents:text_root',
          'firewall:block_contents:text_child',
          'moderation:block_users',
          'moderation:block_contents:text_root',
          'moderation:block_contents:text_child',
          'moderation:unblock_users',
          'moderation:unblock_contents:text_root',
          'moderation:unblock_contents:text_child',
          'reward:user:tabcoins',
          'system:update:tabcoins',
        )
        .messages({
          'any.only': '{#label} não aceita o valor "{#value}".',
        }),
      originator_user_id: Joi.string().allow(null).guid({ version: 'uuidv4' }).optional(),
      originator_ip: Joi.string()
        .ip({
          version: ['ipv4', 'ipv6'],
        })
        .optional(),
      metadata: Joi.when('type', [
        {
          is: 'create:user',
          then: Joi.object({
            id: Joi.string().required(),
          }),
        },
        {
          is: 'update:user',
          then: Joi.object({
            id: Joi.string().required(),
            updatedFields: Joi.array().items(Joi.string()).required(),
            username: Joi.object({
              old: Joi.string().required(),
              new: Joi.string().required(),
            }),
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
        {
          is: Joi.string().valid('moderation:block_users', 'moderation:unblock_users'),
          then: Joi.object({
            related_events: Joi.array().items(Joi.string()).required(),
            users: Joi.array().required(),
          }),
        },
        {
          is: Joi.string().valid(
            'moderation:block_contents:text_root',
            'moderation:block_contents:text_child',
            'moderation:unblock_contents:text_root',
            'moderation:unblock_contents:text_child',
          ),
          then: Joi.object({
            related_events: Joi.array().items(Joi.string()).required(),
            contents: Joi.array().required(),
          }),
        },
      ]),
    });
  },

  firewall_event: function () {
    return Joi.object({
      affected: Joi.object({
        contents: Joi.array().items(schemas.content()).min(1),
        users: Joi.array().items(schemas.user()).min(1).required(),
      }),
      events: Joi.array().items(schemas.event()).min(1).required(),
    });
  },

  firewall_review_action: function () {
    return Joi.object({
      action: Joi.string()
        .trim()
        .valid('confirm', 'undo')
        .when('$required.firewall_review_action', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  user: function () {
    return Joi.object()
      .concat(schemas.id())
      .concat(schemas.created_at())
      .concat(schemas.updated_at())
      .concat(schemas.username())
      .concat(schemas.description())
      .concat(schemas.features())
      .concat(schemas.tabcoins())
      .concat(schemas.tabcash());
  },

  tabcoins: function () {
    return Joi.object({
      tabcoins: Joi.number()
        .integer()
        .min(MIN_INTEGER)
        .max(MAX_INTEGER)
        .when('$required.tabcoins', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  tabcoins_credit: function () {
    const min = 0;
    return Joi.object({
      tabcoins_credit: Joi.number()
        .integer()
        .min(min)
        .max(MAX_INTEGER)
        .when('$required.tabcoins', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'number.unsafe': `{#label} deve possuir um valor entre ${min} e ${MAX_INTEGER}.`,
        }),
    });
  },

  tabcoins_debit: function () {
    const max = 0;
    return Joi.object({
      tabcoins_debit: Joi.number()
        .integer()
        .min(MIN_INTEGER)
        .max(max)
        .when('$required.tabcoins', { is: 'required', then: Joi.required(), otherwise: Joi.optional() })
        .messages({
          'number.unsafe': `{#label} deve possuir um valor entre ${MIN_INTEGER} e ${max}.`,
        }),
    });
  },

  tabcash: function () {
    return Joi.object({
      tabcash: Joi.number()
        .integer()
        .min(MIN_INTEGER)
        .max(MAX_INTEGER)
        .when('$required.tabcash', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  transaction_type: function () {
    return Joi.object({
      transaction_type: Joi.string()
        .trim()
        .valid('credit', 'debit')
        .when('$required.transaction_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },

  ban_type: function () {
    return Joi.object({
      ban_type: Joi.string()
        .trim()
        .valid('nuke')
        .when('$required.ban_type', { is: 'required', then: Joi.required(), otherwise: Joi.optional() }),
    });
  },
};

const noTrailingHyphen = (value) => {
  while (value.endsWith('-')) {
    value = value.slice(0, -1);
  }
  return value;
};

const withoutMarkdown = (value, helpers) => {
  return removeMarkdown(value, { trim: true }).length > 0 ? value : helpers.error('markdown.empty');
};

function checkReservedUsernames(username, helpers) {
  if (
    (webserver.isServerlessRuntime && reservedDevUsernames.includes(username.toLowerCase())) ||
    reservedUsernames.includes(username.toLowerCase()) ||
    reservedUsernamesStartingWith.find((reserved) => username.toLowerCase().startsWith(reserved))
  ) {
    return helpers.error('username.reserved');
  }
  return username;
}

const reservedDevUsernames = ['admin', 'user'];
const reservedUsernamesStartingWith = ['favicon', 'manifest'];
const reservedUsernames = [
  'account',
  'administracao',
  'administrador',
  'administradora',
  'administradores',
  'administrator',
  'afiliado',
  'afiliados',
  'ajuda',
  'alerta',
  'alertas',
  'all',
  'analytics',
  'anonymous',
  'anunciar',
  'anuncie',
  'anuncio',
  'anuncios',
  'api',
  'app',
  'apps',
  'autenticacao',
  'auth',
  'authentication',
  'autorizacao',
  'avatar',
  'backup',
  'banner',
  'banners',
  'beta',
  'blog',
  'cadastrar',
  'cadastro',
  'carrinho',
  'categoria',
  'categorias',
  'categories',
  'category',
  'ceo',
  'cfo',
  'checkout',
  'classificados',
  'comentario',
  'comentarios',
  'compartilhada',
  'compartilhadas',
  'compartilhado',
  'compartilhados',
  'comunidade',
  'comunidades',
  'config',
  'configuracao',
  'configuracoes',
  'configurar',
  'configure',
  'conta',
  'contas',
  'contato',
  'contatos',
  'content',
  'conteudos',
  'contrato',
  'convite',
  'convites',
  'create',
  'criar',
  'css',
  'cto',
  'cultura',
  'curso',
  'cursos',
  'dados',
  'dashboard',
  'desconectar',
  'descricao',
  'description',
  'deslogar',
  'diretrizes',
  'discussao',
  'docs',
  'documentacao',
  'download',
  'downloads',
  'draft',
  'edit',
  'editar',
  'editor',
  'email',
  'estatisticas',
  'eu',
  'faq',
  'features',
  'gerente',
  'grupo',
  'grupos',
  'guest',
  'guidelines',
  'hoje',
  'imagem',
  'imagens',
  'init',
  'interface',
  'licenca',
  'log',
  'login',
  'logout',
  'loja',
  'me',
  'membership',
  'moderacao',
  'moderador',
  'moderadora',
  'moderadoras',
  'moderadores',
  'museu',
  'news',
  'newsletter',
  'newsletters',
  'notificacoes',
  'notification',
  'notifications',
  'ontem',
  'pagina',
  'password',
  'patrocinada',
  'patrocinadas',
  'patrocinado',
  'patrocinados',
  'perfil',
  'pesquisa',
  'popular',
  'post',
  'postar',
  'posts',
  'preferencias',
  'promoted',
  'promovida',
  'promovidas',
  'promovido',
  'promovidos',
  'public',
  'publicar',
  'publish',
  'rascunho',
  'recentes',
  'register',
  'registration',
  'regras',
  'relatorio',
  'relatorios',
  'replies',
  'reply',
  'resetar-senha',
  'resetar',
  'resposta',
  'respostas',
  'root',
  'rootuser',
  'rss',
  'sair',
  'senha',
  'sobre',
  'sponsored',
  'status',
  'sudo',
  'superuser',
  'suporte',
  'support',
  'swr',
  'sysadmin',
  'tabnew',
  'tabnews',
  'tag',
  'tags',
  'termos-de-uso',
  'termos',
  'terms',
  'toc',
  'todos',
  'trending',
  'upgrade',
  'username',
  'users',
  'usuario',
  'usuarios',
  'va',
  'vagas',
  'videos',
];
