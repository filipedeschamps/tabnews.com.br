import { truncate } from '@tabnews/helpers';

import database from 'infra/database';
import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import { FirewallEmail, NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function create(postedNotificationData) {
  maybeDeleteOld();

  const query = {
    text: `
      INSERT INTO
        notifications (user_id, type, entity_id, content_link, message)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        *
      ;`,
    values: [
      postedNotificationData.user_id,
      postedNotificationData.type,
      postedNotificationData.entity_id,
      postedNotificationData.content_link,
      postedNotificationData.message,
    ],
  };

  const results = await database.query(query);
  const newNotification = results.rows[0];
  return newNotification;
}

let lastCleanupAt = null;

async function maybeDeleteOld() {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (lastCleanupAt && Date.now() - lastCleanupAt < ONE_DAY) {
    return;
  }

  await database.query(`
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '90 days';
  `);

  lastCleanupAt = Date.now();
}

function setLastCleanupAt(value) {
  lastCleanupAt = value;
}

async function read(notificationId, user_id) {
  const query = {
    text: `
      UPDATE
        notifications
      SET
        is_read = TRUE,
        updated_at = (now() at time zone 'utc')
      WHERE
        id = $1 AND user_id = $2
      ;`,
    values: [notificationId, user_id],
  };

  await database.query(query);
}

async function markAllAsRead(userId) {
  const query = {
    text: `
      UPDATE
        notifications
      SET
        is_read = TRUE,
        updated_at = (now() at time zone 'utc')
      WHERE
        user_id = $1
      ;`,
    values: [userId],
  };

  await database.query(query);
}

async function count(values = {}, options = {}) {
  const where = values.where ?? {};

  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      SELECT
        COUNT(1)
      FROM
        notifications
        ${whereClause.text}
      ;`,
    values: whereClause.values,
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

async function findAll(values = {}, options = {}) {
  const where = values.where ?? {};
  const { limit = 5, offset = 0 } = options;

  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      SELECT
        *
      FROM
        notifications
        ${whereClause.text}
      ORDER BY
        is_read ASC, created_at DESC
      LIMIT $${whereClause.values.length + 1} OFFSET $${whereClause.values.length + 2};`,
    values: [...whereClause.values, limit, offset],
  };

  const results = await database.query(query);
  return results.rows;
}

function buildWhereClause(where, nextArgumentIndex = 1) {
  const values = [];
  const conditions = Object.entries(where).map(([column, value]) => {
    values.push(value);
    return Array.isArray(value) ? `${column} = ANY ($${nextArgumentIndex++})` : `${column} = $${nextArgumentIndex++}`;
  });

  return {
    text: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values: values,
    nextArgumentIndex: nextArgumentIndex,
  };
}

async function sendReplyEmailToParentUser(createdContent) {
  const anonymousUser = user.createAnonymous();
  const secureCreatedContent = authorization.filterOutput(anonymousUser, 'read:content', createdContent);

  const parentContent = await content.findOne({
    where: {
      id: secureCreatedContent.parent_id,
    },
  });

  if (parentContent.owner_id !== secureCreatedContent.owner_id && secureCreatedContent.status === 'published') {
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

    create({
      user_id: secureRootContent.owner_id,
      type: 'reply',
      entity_id: secureCreatedContent.id,
      content_link: childContentUrl,
      message: bodyReplyLine,
    });

    await email.triggerSend({
      to: parentContentUser.email,
      from: 'TabNews <contato@tabnews.com.br>',
      subject: subject,
      html,
      text,
    });
  }
}

function getReplyEmailSubject({ createdContent, rootContent }) {
  const sanitizedRootContentTitle =
    rootContent.status === 'published' ? truncate(rootContent.title, 58) : '[Não disponível]';
  return `"${createdContent.owner_username}" comentou em "${sanitizedRootContentTitle}"`;
}

function getBodyReplyLine({ createdContent, rootContent }) {
  const sanitizedRootContentTitle = rootContent.status === 'published' ? rootContent.title : '[Não disponível]';

  if (createdContent.parent_id === rootContent.id) {
    return `"${createdContent.owner_username}" respondeu à sua publicação "${sanitizedRootContentTitle}".`;
  }

  return `"${createdContent.owner_username}" respondeu ao seu comentário na publicação "${sanitizedRootContentTitle}".`;
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

  await email.triggerSend({
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

  await email.triggerSend({
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
  findAll,
  count,
  read,
  markAllAsRead,
  sendContentDeletedToUser,
  sendReplyEmailToParentUser,
  sendUserDisabled,
});

export { create, setLastCleanupAt }; // Only use in tests
