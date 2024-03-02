import { TooManyRequestsError } from 'errors';
import database from 'infra/database.js';
import content from 'models/content.js';
import event from 'models/event.js';
import notification from 'models/notification.js';


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
        'Você está tentando criar muitos usuários, então usuários criados recentemente podem ter sido desabilitados.',
    });
  }
}

async function createUserRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_user_side_effect($1)',
    values: [context.clientIp],
  });

  const usersAffected = results.rows.map((row) => row.user_id);

  const createdEvent = await event.create({
    type: 'firewall:block_users',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:user',
      users: usersAffected,
    },
  });

  await sendUserNotification(results.rows, createdEvent);
}

async function sendUserNotification(userRows, event) {
  const notifications = [];

  for (const userObject of userRows) {
    notifications.push(
      notification.sendUserDisabled({
        eventId: event.id,
        user: {
          id: userObject.user_id,
          email: userObject.user_email,
          username: userObject.user_username,
        },
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
        'Você está tentando criar muitas publicações, então publicações criadas recentemente podem ter sido removidas.',
    });
  }
}

async function createContentTextRootRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_root_side_effect($1)',
    values: [context.clientIp],
  });

  const contentsAffected = results.rows.map((row) => row.content_id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_root',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_root',
      contents: contentsAffected,
    },
  });

  await Promise.allSettled([
    undoContentsTabcoins(results.rows, createdEvent),
    sendContentTextNotification(results.rows, createdEvent),
  ]);
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
        'Você está tentando criar muitos comentários, então comentários criados recentemente podem ter sido removidos.',
    });
  }
}

async function createContentTextChildRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_child_side_effect($1)',
    values: [context.clientIp],
  });

  const contentsAffected = results.rows.map((row) => row.content_id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_child',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_child',
      contents: contentsAffected,
    },
  });

  await Promise.allSettled([
    undoContentsTabcoins(results.rows, createdEvent),
    sendContentTextNotification(results.rows, createdEvent),
  ]);
}

async function undoContentsTabcoins(contentRows, createdEvent) {
  for (const contentObject of contentRows) {
    const contentWithoutStatus = {
      id: contentObject.content_id,
      owner_id: contentObject.content_owner_id,
      published_at: contentObject.content_published_at,
      tabcoins: contentObject.content_tabcoins,
    };
    await content.creditOrDebitTabCoins(
      {
        ...contentWithoutStatus,
        status: 'published',
      },
      {
        ...contentWithoutStatus,
        status: contentObject.content_status,
      },
      {
        eventId: createdEvent.id,
      },
    );
  }
}

async function sendContentTextNotification(contentRows, event) {
  const usersToNotify = {};

  for (const row of contentRows) {
    if (row.content_owner_id !== event.originator_user_id) {
      if (usersToNotify[row.content_owner_id]) {
        usersToNotify[row.content_owner_id].push(row);
      } else {
        usersToNotify[row.content_owner_id] = [row];
      }
    }
  }

  const notifications = [];

  for (const [userId, contents] of Object.entries(usersToNotify)) {
    notifications.push(
      notification.sendContentDeletedToUser({
        contents: contents.map((content) => ({
          id: content.content_id,
          title: content.content_title,
        })),
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
