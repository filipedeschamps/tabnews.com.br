import user from 'models/user.js';
import content from 'models/content.js';
import activation from 'models/activation';
import email from 'infra/email.js';

async function sendNotificationOnNewComment(createdContent) {
  const rootContent = await findRootContent(createdContent.parent_id);
  if (rootContent.owner_id !== createdContent.owner_id) {
    const contentCreator = await user.findOneById(rootContent.owner_id);
    const userWhoCommented = await user.findOneById(createdContent.owner_id);
    const redirectPageEndpoint = getRedirectPageEndpoint(rootContent);
    // O ideal é pegar o conteúdo principal para enviar link com todas as discussões

    await email.send({
      to: contentCreator.email,
      from: {
        name: 'TabNews',
        address: 'contato@tabnews.com.br',
      },
      subject: `O usuário ${userWhoCommented.username} comentou na sua postagem`,
      text: `Olá, ${contentCreator.username}!
Clique aqui para ler o novo comentário ${redirectPageEndpoint}`,
    });
  }
}

function getRedirectPageEndpoint({ username, slug }) {
  // é correto buscar essa função do model activation?
  let webserverHost = activation.getWebServerHost();

  return `${webserverHost}/${username}/${slug}`;
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
