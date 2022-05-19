import email from 'infra/email.js';
import user from 'models/user.js';
import content from 'models/content.js';
import database from 'infra/database';

async function sendNotificationOnNewComment(currentContent) {
  const rootContent = await findRootContent(currentContent.parent_id);
  if (rootContent.owner_id !== currentContent.owner_id) {
    const contentCreator = await user.findOneById(rootContent.owner_id);
    const userWhoCommented = await user.findOneById(currentContent.owner_id);

    await email.send({
      to: contentCreator.email,
      from: {
        name: 'TabNews',
        address: 'contato@tabnews.com.br',
      },
      subject: `O usuário ${userWhoCommented.username} comentou na sua postagem`,
      text: `
Sua postagem:
${rootContent.body}

Comentário:
${currentContent.body}`,
    });

    const findLastContent = await content.findOne({
      where: {
        parent_id: currentContent.parent_id,
      },
    });

    await create(findLastContent.id);
  }
}

async function create(content_id) {
  const query = {
    text: `INSERT INTO notifications (content_id)
           VALUES($1);`,
    values: [content_id],
  };

  await database.query(query);
}

async function findRootContent(parent_id) {
  const rootContent = await content.findOne({
    where: {
      id: parent_id,
    },
  });
  return rootContent;
}

export default Object.freeze({
  sendNotificationOnNewComment,
});
