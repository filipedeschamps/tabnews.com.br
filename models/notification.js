import user from 'models/user.js';
import content from 'models/content.js';
import webserver from 'infra/webserver.js';
import email from 'infra/email.js';
import validator from 'models/validator.js';
import database from 'infra/database.js';

async function findAll(options = {}) {
  options.where = validateWhereSchema(options?.where);
  const whereClause = buildWhereClause(options?.where);
  const orderByClause = buildOrderByClause(options?.order);

  const query = {
    text: `
      SELECT * FROM notifications
      ${whereClause}
      ${orderByClause}
      ;`,
  };

  if (options.where) {
    query.values = Object.values(options.where);
  }

  const results = await database.query(query);
  return results.rows;

  function validateWhereSchema(where) {
    if (!where) {
      return;
    }

    const cleanValues = validator(where, {
      id: 'optional',
      content_id: 'optional',
      type: 'optional',
      receiver_id: 'optional',
    });

    return cleanValues;
  }

  function buildWhereClause(columns) {
    if (!columns) {
      return '';
    }

    return Object.entries(columns).reduce((accumulator, column, index) => {
      if (index === 0) {
        return `WHERE ${getColumnDeclaration(column, index)}`;
      } else {
        return `${accumulator} AND ${getColumnDeclaration(column, index)}`;
      }

      function getColumnDeclaration(column, index) {
        if (column[1] === null) {
          return `notifications.${column[0]} IS NOT DISTINCT FROM $${index + 1}`;
        } else {
          return `notifications.${column[0]} = $${index + 1}`;
        }
      }
    }, '');
  }

  function buildOrderByClause(orderBy) {
    if (!orderBy) {
      return '';
    }

    return `ORDER BY ${orderBy}`;
  }
}

async function findOne(options) {
  const rows = await findAll(options);
  return rows[0];
}

async function findWithStrategy(options = {}) {
  const strategies = {
    descending: getDescending,
    ascending: getAscending,
  };

  return await strategies[options.strategy](options);

  async function getDescending(options = {}) {
    options.order = 'created_at DESC';
    return await findAll(options);
  }

  async function getAscending(options = {}) {
    options.order = 'created_at ASC';
    return await findAll(options);
  }
}

async function create(postedNotificationData) {
  const validNotificationData = await validatePostSchema(postedNotificationData);

  if (validNotificationData.type === 'content') {
    // We are doing this again for the different types of notification
    const validContentNotificationData = await validateContentNotificationSchema(validNotificationData);

    const createdContent = await content.findOne({
      where: { id: validContentNotificationData.content_id },
    });

    const rootContent = await content.findOne({
      where: {
        id: createdContent.parent_id,
      },
    });

    if (rootContent.owner_id === createdContent.owner_id) {
      return;
    }
    await sendReplyEmailToParentUser(createdContent, rootContent);
    return await runInsertQueryWithContent(validContentNotificationData);
  }

  async function runInsertQueryWithContent(validNotificationData) {
    const query = {
      text: 'INSERT INTO notifications (content_id, type, receiver_id) VALUES($1, $2, $3) RETURNING *;',
      values: [validNotificationData.content_id, validNotificationData.type, validNotificationData.receiver_id],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

async function validateContentNotificationSchema(postedContentNotificationData) {
  const cleanValues = validator(postedContentNotificationData, {
    content_id: 'required',
    type: 'required',
    receiver_id: 'required',
  });

  return cleanValues;
}

async function validatePostSchema(postedNotificationData) {
  const cleanValues = validator(postedNotificationData, {
    content_id: 'optional',
    type: 'required',
    receiver_id: 'required',
  });

  return cleanValues;
}

async function sendReplyEmailToParentUser(createdContent, rootContent) {
  const rootContentUser = await user.findOneById(rootContent.owner_id);
  const childContendUrl = getChildContendUrl(createdContent);

  await email.send({
    to: rootContentUser.email,
    from: {
      name: 'TabNews',
      address: 'no_reply@tabnews.com.br',
    },
    subject: `"${createdContent.username}" comentou na sua postagem!`,
    text: `Olá, ${rootContentUser.username}!

${createdContent.username} respondeu sua publicação com:

${createdContent.body.length <= 30 ? createdContent.body : createdContent.body.substring(0, 30) + '...'}

${
  createdContent.body.length <= 30
    ? `Para ler o comentário, utilize o link abaixo:`
    : `Para ler o comentário inteiro, utilize o link abaixo:`
}

${childContendUrl}

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
  });
}

function getChildContendUrl({ username, slug }) {
  let webserverHost = webserver.getHost();

  return `${webserverHost}/${username}/${slug}`;
}

export default Object.freeze({
  sendReplyEmailToParentUser,
  create,
  findAll,
  findOne,
  findWithStrategy,
});
