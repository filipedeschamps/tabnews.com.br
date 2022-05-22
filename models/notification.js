import user from 'models/user.js';
import content from 'models/content.js';
import webserver from 'infra/webserver.js';
import email from 'infra/email.js';
import validator from 'models/validator.js';
import database from 'infra/database.js';

async function create(postedNotificationData) {
  const validNotificationData = await validatePostSchema(postedNotificationData);

  if (validNotificationData.type === 'content') {
    // We are doing this again for the different types of notification
    const validContentNotificationData = await validateContentNotificationSchema(validNotificationData);

    const createdContent = await content.findOne({
      where: {id: validContentNotificationData.content_id},
    });

    await sendReplyEmailToParentUser(createdContent);
    return await runInsertQueryWithContent(validContentNotificationData);
  }

  async function runInsertQueryWithContent(validNotificationData) {
    const query = {
      text: 'INSERT INTO notifications (content_id, type) VALUES($1, $2) RETURNING *;',
      values: [validNotificationData.content_id, validNotificationData.type],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

async function validateContentNotificationSchema(postedContentNotificationData) {
  const cleanValues = validator(postedContentNotificationData, {
    content_id: 'required',
    type: 'required',
  });

  return cleanValues;
}

async function validatePostSchema(postedNotificationData) {
  const cleanValues = validator(postedNotificationData, {
    content_id: 'optional',
    type: 'required',
  });

  return cleanValues;
}

async function sendReplyEmailToParentUser(createdContent) {
  const rootContent = await content.findOne({
    where: {
      id: createdContent.parent_id,
    },
  });

  if (rootContent.owner_id !== createdContent.owner_id) {
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
}

function getChildContendUrl({ username, slug }) {
  let webserverHost = webserver.getHost();

  return `${webserverHost}/${username}/${slug}`;
}

export default Object.freeze({
  // sendReplyEmailToParentUser,
  create,
});
