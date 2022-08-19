import user from 'models/user.js';
import content from 'models/content.js';
import webserver from 'infra/webserver.js';
import email from 'infra/email.js';

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
        address: 'contato@tabnews.com.br',
      },
      subject: `"${createdContent.owner_username}" comentou na sua postagem!`,
      text: `Olá, ${rootContentUser.username}!

Para ler o comentário, utilize o link abaixo:

${childContendUrl}

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
    });
  }
}

function getChildContendUrl({ owner_username, slug }) {
  let webserverHost = webserver.getHost();

  return `${webserverHost}/${owner_username}/${slug}`;
}

export default Object.freeze({
  sendReplyEmailToParentUser,
});
