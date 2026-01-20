import { truncate } from '@tabnews/helpers';

import database from 'infra/database';
import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import pagination from 'models/pagination.js';
import { FirewallEmail, NotificationEmail } from 'models/transactional';
import user from 'models/user.js';

async function create(postedNotificationData) {
  const query = {
    text: `
      INSERT INTO
        notifications (user_id, type, entity_id, metadata, read)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        *
      ;`,
    values: [
      postedNotificationData.user_id,
      postedNotificationData.type,
      postedNotificationData.entity_id,
      postedNotificationData.metadata,
      postedNotificationData.read || false,
    ],
  };

  const results = await database.query(query);
  const newNotification = results.rows[0];
  return newNotification;
}

async function findAll(values) {
  const offset = (values.page - 1) * values.per_page;
  const where = values.where ?? {};
  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      SELECT
        *
      FROM
        notifications
      ${whereClause.text}
      ORDER BY
        created_at DESC
      LIMIT $${whereClause.values.length + 1} OFFSET $${whereClause.values.length + 2};
    `,
    values: [...whereClause.values, values.per_page, offset],
  };

  const queryResults = await database.query(query);

  const results = {
    rows: queryResults.rows,
  };

  values.total_rows = await count({ where: where });

  results.pagination = pagination.get(values);

  return results;
}

async function update(notification, values = {}) {
  const where = values.where ?? {};
  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      UPDATE
        notifications
      SET
        read = $${whereClause.values.length + 1},
        updated_at = (now() at time zone 'utc')
      ${whereClause.text}
      ;`,
    values: [...whereClause.values, notification.read],
  };

  await database.query(query);
}

async function markAllAsRead(userId, unread_until = new Date()) {
  const query = {
    text: `
      UPDATE
        notifications
      SET
        read = $2,
        updated_at = (now() at time zone 'utc')
      WHERE
        user_id = $1 and created_at <= $3
      ;`,
    values: [userId, true, unread_until],
  };

  await database.query(query);
}

async function count(values = {}, options = {}) {
  const where = values.where ?? {};

  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      SELECT
        COUNT(1)::integer as count
      FROM
        notifications
        ${whereClause.text}
      ;`,
    values: whereClause.values,
  };

  const results = await database.query(query, options);
  return results.rows[0].count;
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
      user_id: parentContent.owner_id,
      type: 'content:created',
      entity_id: secureCreatedContent.id,
      metadata: {
        content_owner_id: secureCreatedContent.owner_id,
        content_slug: secureCreatedContent.slug,
        content_owner: secureCreatedContent.owner_username,
        content_title: secureCreatedContent.title,
        parent_owner_id: parentContent.owner_id,
        parent_title: parentContent.title,
        root_content_owner_id: secureRootContent.owner_id,
        root_content_slug: secureRootContent.slug,
        root_content_title: secureRootContent.title,
        root_content_owner: secureRootContent.owner_username,
      },
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
  update,
  markAllAsRead,
  create,
  sendContentDeletedToUser,
  sendReplyEmailToParentUser,
  sendUserDisabled,
});
