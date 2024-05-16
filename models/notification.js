import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import { NotificationWeb } from 'models/notifications';
import { NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function commonData(createdContent) {
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
      return null;
    }

    const childContentUrl = getChildContendUrl(secureCreatedContent);
    const rootContent = parentContent.parent_id
      ? await content.findOne({
          where: {
            id: parentContent.path[0],
          },
          attributes: { exclude: ['body'] },
        })
      : parentContent;

    const secureRootContent = authorization.filterOutput(anonymousUser, 'read:content', rootContent);

    const subject = getSubject({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const bodyReplyLine = getBodyReplyLine({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    const typeNotification = getTypeNotification({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    return { parentContentUser, childContentUrl, subject, typeNotification, bodyReplyLine, secureCreatedContent };
  }
}

async function sendReplyEmailToParentUser(createdContent) {
  const commonDataResult = await commonData(createdContent);
  if (!commonDataResult) return;

  const { parentContentUser, childContentUrl, subject, bodyReplyLine } = commonDataResult;

  const { html, text } = NotificationEmail({
    username: parentContentUser.username,
    bodyReplyLine,
    contentLink: childContentUrl,
  });

  await email.send({
    to: parentContentUser.email,
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    subject,
    html,
    text,
  });
}

async function sendReplyNotificationWebToParentUser(createdContent) {
  const commonDataResult = await commonData(createdContent);
  if (!commonDataResult) return;

  const { parentContentUser, childContentUrl, bodyReplyLine, secureCreatedContent, typeNotification } =
    commonDataResult;

  await NotificationWeb.send({
    from: secureCreatedContent.owner_id,
    type: typeNotification,
    to_id: parentContentUser.id,
    to_email: parentContentUser.email,
    to_username: parentContentUser.username,
    bodyReplyLine,
    contentLink: childContentUrl,
  });
}

function getSubject({ createdContent, rootContent }) {
  const sanitizedRootContentTitle =
    rootContent.title.length > 55 ? `${rootContent.title.substring(0, 55)}...` : rootContent.title;

  return `"${createdContent.owner_username}" comentou em "${sanitizedRootContentTitle}"`;
}

function getBodyReplyLine({ createdContent, rootContent }) {
  if (createdContent.parent_id === rootContent.id) {
    return `"${createdContent.owner_username}" respondeu à sua publicação "${rootContent.title}".`;
  }

  return `"${createdContent.owner_username}" respondeu ao seu comentário na publicação "${rootContent.title}".`;
}

function getChildContendUrl({ owner_username, slug }) {
  return `${webserver.host}/${owner_username}/${slug}`;
}

function getTypeNotification({ createdContent, rootContent }) {
  if (createdContent.parent_id === rootContent.id) {
    return 'post';
  }

  return 'comment';
}

export default Object.freeze({
  sendReplyEmailToParentUser,
  sendReplyNotificationWebToParentUser,
});
