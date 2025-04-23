import { truncate } from '@tabnews/helpers';

import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import { FirewallEmail, NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function sendReplyEmailToParentUser(createdContent) {
  const anonymousUser = user.createAnonymous();
  const secureCreatedContent = authorization.filterOutput(anonymousUser, 'read:content', createdContent);

  const parentContent = await content.findOne({
    where: {
      id: secureCreatedContent.parent_id,
    },
  });

  if (parentContent.owner_id !== secureCreatedContent.owner_id) {
    const parentContentUser = await user.findOneById(parentContent.owner_id);

    if (parentContentUser.notifications === false) {
      return;
    }

    const childContentUrl = getContentUrl(secureCreatedContent);
    const rootContent = parentContent.parent_id
      ? await content.findOne({
          where: {
            id: parentContent.path[0],
          },
          attributes: { exclude: ['body'] },
        })
      : parentContent;

    const secureRootContent = authorization.filterOutput(anonymousUser, 'read:content', rootContent);

    const subject = getReplyEmailSubject({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const bodyReplyLine = getBodyReplyLine({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const { html, text } = NotificationEmail({
      username: parentContentUser.username,
      bodyReplyLine: bodyReplyLine,
      contentLink: childContentUrl,
    });

    await email.send({
      to: parentContentUser.email,
      from: 'TabNews <contato@tabnews.com.br>',
      subject: subject,
      html,
      text,
    });
  }
}

function getReplyEmailSubject({ createdContent, rootContent }) {
  const sanitizedRootContentTitle = truncate(rootContent.title, 58);
  return `"${createdContent.owner_username}" comentou em "${sanitizedRootContentTitle}"`;
}

function getBodyReplyLine({ createdContent, rootContent }) {
  if (createdContent.parent_id === rootContent.id) {
    return `"${createdContent.owner_username}" respondeu à sua publicação "${rootContent.title}".`;
  }

  return `"${createdContent.owner_username}" respondeu ao seu comentário na publicação "${rootContent.title}".`;
}

function getContentUrl({ owner_username, slug }) {
  return `${webserver.host}/${owner_username}/${slug}`;
}

async function sendUserDisabled({ eventId, user }) {
  const { html, text } = FirewallEmail({
    sideEffectLine: 'Identificamos a criação de muitos usuários em um curto período, então a sua conta foi desativada.',
    eventId: eventId,
    username: user.username,
  });

  await email.send({
    to: user.email,
    from: 'TabNews <contato@tabnews.com.br>',
    subject: 'Sua conta foi desativada',
    html,
    text,
  });
}

async function sendContentDeletedToUser({ contents, eventId, userId }) {
  const deletedContentLine = getFirewallDeletedContentLine(contents);

  const subject = contents.length > 1 ? 'Alguns conteúdos seus foram removidos' : 'Um conteúdo seu foi removido';

  const userToNotify = await user.findOneById(userId);

  const { html, text } = FirewallEmail({
    sideEffectLine: deletedContentLine,
    eventId: eventId,
    username: userToNotify.username,
  });

  await email.send({
    to: userToNotify.email,
    from: 'TabNews <contato@tabnews.com.br>',
    subject: subject,
    html,
    text,
  });
}

function getFirewallDeletedContentLine(contents) {
  const formatter = new Intl.ListFormat('pt-BR');
  const contentsReference = contents.map((content) => `"${content.title ?? content.id}"`);
  const formattedList = formatter.format(contentsReference);
  const isRootContent = !!contents[0].title;

  let beforeTitles;
  let afterTitles;
  if (isRootContent) {
    if (contents.length > 1) {
      beforeTitles = 'muitas publicações em um curto período, então as suas publicações';
      afterTitles = 'foram removidas';
    } else {
      beforeTitles = 'muitas publicações em um curto período, então a sua publicação';
      afterTitles = 'foi removida';
    }
  } else {
    if (contents.length > 1) {
      beforeTitles = 'muitos comentários em um curto período, então os seus comentários de IDs';
      afterTitles = 'foram removidos';
    } else {
      beforeTitles = 'muitos comentários em um curto período, então o seu comentário de ID';
      afterTitles = 'foi removido';
    }
  }

  return `Identificamos a criação de ${beforeTitles} ${formattedList} ${afterTitles}.`;
}

export default Object.freeze({
  sendContentDeletedToUser,
  sendReplyEmailToParentUser,
  sendUserDisabled,
});
