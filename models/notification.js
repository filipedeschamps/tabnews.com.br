import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import { webNotify } from 'models/notifications';
import { NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function prepareData(createdContent) {
  const anonymousUser = user.createAnonymous();
  const secureCreatedContent = authorization.filterOutput(anonymousUser, 'read:content', createdContent);

  const parentContent = await content.findOne({
    where: {
      id: secureCreatedContent.parent_id,
    },
  });

  if (parentContent.owner_id !== secureCreatedContent.owner_id) {
    const parentContentUser = await user.findOneById(parentContent.owner_id);

    if (!parentContentUser.notifications) {
      return;
    }

    const childContentUrl = getChildContentUrl(secureCreatedContent);
    const rootContent = parentContent.parent_id
      ? await content.findOne({
          where: {
            id: parentContent.path[0],
          },
          attributes: { exclude: ['body'] },
        })
      : parentContent;

    const secureRootContent = authorization.filterOutput(anonymousUser, 'read:content', rootContent);

    const details = getDetails({
      createdContent: secureCreatedContent,
      rootContent: secureRootContent,
    });

    return {
      parentContentUser,
      childContentUrl,
      ...details,
      secureCreatedContent,
    };
  }
}

function getDetails({ createdContent, rootContent }) {
  const sanitizedRootContentTitle =
    rootContent.title.length > 55 ? `${rootContent.title.substring(0, 55)}...` : rootContent.title;

  const subject = `"${createdContent.owner_username}" comentou em "${sanitizedRootContentTitle}"`;

  const bodyReplyLine =
    createdContent.parent_id === rootContent.id
      ? `"${createdContent.owner_username}" respondeu à sua publicação "${rootContent.title}".`
      : `"${createdContent.owner_username}" respondeu ao seu comentário na publicação "${rootContent.title}".`;

  const type = createdContent.parent_id === rootContent.id ? 'root_content' : 'child_content';

  return { subject, bodyReplyLine, type };
}

async function sendReplyEmailToParentUser(createdContent) {
  const data = await prepareData(createdContent);
  if (!data) return;

  const { parentContentUser, childContentUrl, subject, bodyReplyLine } = data;

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

async function sendReplyWebToParentUser(createdContent) {
  const data = await prepareData(createdContent);
  if (!data) return;

  const { parentContentUser, childContentUrl, bodyReplyLine, secureCreatedContent, type } = data;

  await webNotify.send({
    sender_id: secureCreatedContent.owner_id,
    recipient_id: parentContentUser.id,
    type: 'alert',
    event_type: type,
    body_reply_line: bodyReplyLine,
    content_link: childContentUrl,
  });
}

function getChildContentUrl({ owner_username, slug }) {
  return `${webserver.host}/${owner_username}/${slug}`;
}

export default Object.freeze({
  sendReplyEmailToParentUser,
  sendReplyWebToParentUser,
});
