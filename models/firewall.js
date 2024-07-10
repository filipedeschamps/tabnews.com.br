import { TooManyRequestsError } from 'errors';
import database from 'infra/database.js';
import event from 'models/event.js';
import notification from 'models/notification';

const rules = {
  'create:user': createUserRule,
  'create:content:text_root': createContentTextRootRule,
  'create:content:text_child': createContentTextChildRule,
};

function canRequest(ruleId) {
  return async function (request, response, next) {
    try {
      await rules[ruleId](request.context);
      next();
    } catch (error) {
      // Pass if database's stored procedure is not yet deployed
      if (error.databaseErrorCode === database.errorCodes.UNDEFINED_FUNCTION) {
        return next();
      }

      throw error;
    }
  };
}

async function createUserRule(context) {
  const results = await database.query({
    text: 'select firewall_create_user($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_user;

  if (!pass) {
    await createUserRuleSideEffect(context);

    throw new TooManyRequestsError({
      message:
        'Identificamos a criação de muitos usuários em um curto período, então usuários criados recentemente podem ter sido desativados.',
    });
  }
}

async function createUserRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_user_side_effect($1)',
    values: [context.clientIp],
  });

  const affectedUsersIds = results.rows.map((user) => user.id);

  const createdEvent = await event.create({
    type: 'firewall:block_users',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:user',
      users: affectedUsersIds,
    },
  });

  await sendUserNotification(results.rows, createdEvent);
}

async function sendUserNotification(userRows, event) {
  const notifications = [];

  for (const user of userRows) {
    notifications.push(
      notification.sendUserDisabled({
        eventId: event.id,
        user: user,
      }),
    );
  }

  return Promise.allSettled(notifications);
}

async function createContentTextRootRule(context) {
  const results = await database.query({
    text: 'select firewall_create_content_text_root($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_content_text_root;

  if (!pass) {
    await createContentTextRootRuleSideEffect(context);

    throw new TooManyRequestsError({
      message:
        'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
    });
  }
}

async function createContentTextRootRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_root_side_effect($1)',
    values: [context.clientIp],
  });

  const affectedContentsIds = results.rows.map((row) => row.id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_root',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_root',
      contents: affectedContentsIds,
    },
  });

  await sendContentTextNotification(results.rows, createdEvent);
}

async function createContentTextChildRule(context) {
  const results = await database.query({
    text: 'select firewall_create_content_text_child($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_content_text_child;

  if (!pass) {
    await createContentTextChildRuleSideEffect(context);

    throw new TooManyRequestsError({
      message:
        'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
    });
  }
}

async function createContentTextChildRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_child_side_effect($1)',
    values: [context.clientIp],
  });

  const affectedContentsIds = results.rows.map((row) => row.id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_child',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_child',
      contents: affectedContentsIds,
    },
  });

  await sendContentTextNotification(results.rows, createdEvent);
}

async function sendContentTextNotification(contentRows, event) {
  const usersToNotify = {};

  for (const content of contentRows) {
    if (content.owner_id !== event.originator_user_id) {
      if (usersToNotify[content.owner_id]) {
        usersToNotify[content.owner_id].push(content);
      } else {
        usersToNotify[content.owner_id] = [content];
      }
    }
  }

  const notifications = [];

  for (const [userId, contents] of Object.entries(usersToNotify)) {
    notifications.push(
      notification.sendContentDeletedToUser({
        contents: contents,
        eventId: event.id,
        userId: userId,
      }),
    );
  }

  return Promise.allSettled(notifications);
}

export default Object.freeze({
  canRequest,
});
