import { NotFoundError, TooManyRequestsError, ValidationError } from 'errors';
import database from 'infra/database.js';
import balance from 'models/balance.js';
import content from 'models/content.js';
import event from 'models/event.js';
import notification from 'models/notification.js';
import user from 'models/user.js';

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
        'Identificamos a criação de muitos usuários em um curto período, então usuários criados recentemente podem ter sido desabilitados.',
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

  for (const userObject of userRows) {
    notifications.push(
      notification.sendUserDisabled({
        eventId: event.id,
        user: userObject,
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

  await Promise.allSettled([
    undoContentsTabcoins(results.rows, createdEvent),
    sendContentTextNotification(results.rows, createdEvent),
  ]);
}

async function undoContentsTabcoins(contentRows, createdEvent) {
  for (const contentObject of contentRows) {
    await content.creditOrDebitTabCoins(
      {
        ...contentObject,
        status: contentObject.status_before_update,
      },
      contentObject,
      {
        eventId: createdEvent.id,
      },
    );
  }
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

async function reviewEvent({ context, eventId, action }) {
  if (action === 'confirm') {
    return confirmSideEffects(context, eventId);
  }
  return undoSideEffects(context, eventId);
}

async function confirmSideEffects(context, eventId) {
  const firewallEvent = await validateAndGetFirewallEventToReview(eventId);

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const metadata = { original_event_id: eventId };
    let eventType;

    if (firewallEvent.type === 'firewall:block_users') {
      metadata.users = firewallEvent.metadata.users;
      eventType = 'moderation:block_users';
    } else if (firewallEvent.type === 'firewall:block_contents:text_root') {
      metadata.contents = firewallEvent.metadata.contents;
      eventType = 'moderation:block_contents:text_root';
    } else {
      metadata.contents = firewallEvent.metadata.contents;
      eventType = 'moderation:block_contents:text_child';
    }

    const createdEvent = await event.create(
      {
        type: eventType,
        originatorUserId: context.user.id,
        originatorIp: context.clientIp,
        metadata: metadata,
      },
      {
        transaction: transaction,
      },
    );

    const events = [firewallEvent, createdEvent];

    if (firewallEvent.type === 'firewall:block_users') {
      const affectedUsers = await confirmBlockUsers(firewallEvent, {
        transaction: transaction,
      });

      await transaction.query('COMMIT');
      return {
        affected: {
          users: affectedUsers,
        },
        events: events,
      };
    }

    const affected = await confirmBlockContents(createdEvent, firewallEvent, {
      transaction: transaction,
    });

    await transaction.query('COMMIT');
    return {
      affected: affected,
      events: events,
    };
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    await transaction.release();
  }
}

async function confirmBlockUsers(firewallEvent, options = {}) {
  const users = await user.findAll(
    {
      where: {
        ids: firewallEvent.metadata.users,
      },
    },
    options,
  );

  const ids = users.map((userData) => userData.id);

  const affectedUsers = user.addFeatures(ids, ['nuked'], {
    ...options,
    withBalance: true,
    ignoreUpdatedAt: true,
  });
  return affectedUsers;
}

async function confirmBlockContents(firewallEvent, options) {
  const affectedContents = await content.confirmFirewallStatus(firewallEvent.metadata.contents, options);

  const usersIds = new Set();

  for (const content of affectedContents) {
    usersIds.add(content.owner_id);
  }

  let affectedUsers = [];

  if (usersIds.size) {
    affectedUsers = await user.findAll(
      {
        where: {
          ids: Array.from(usersIds),
        },
      },
      options,
    );
  }

  return {
    contents: affectedContents,
    users: affectedUsers,
  };
}

async function undoSideEffects(context, eventId) {
  const firewallEvent = await validateAndGetFirewallEventToReview(eventId);

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const metadata = { original_event_id: eventId };
    let eventType;

    if (firewallEvent.type === 'firewall:block_users') {
      metadata.users = firewallEvent.metadata.users;
      eventType = 'moderation:unblock_users';
    } else if (firewallEvent.type === 'firewall:block_contents:text_root') {
      metadata.contents = firewallEvent.metadata.contents;
      eventType = 'moderation:unblock_contents:text_root';
    } else {
      metadata.contents = firewallEvent.metadata.contents;
      eventType = 'moderation:unblock_contents:text_child';
    }

    const createdEvent = await event.create(
      {
        type: eventType,
        originatorUserId: context.user.id,
        originatorIp: context.clientIp,
        metadata: metadata,
      },
      {
        transaction: transaction,
      },
    );

    const events = [firewallEvent, createdEvent];

    if (firewallEvent.type === 'firewall:block_users') {
      const affectedUsers = await unblockUsers(firewallEvent, {
        transaction: transaction,
      });

      await transaction.query('COMMIT');
      return {
        affected: {
          users: affectedUsers,
        },
        events: events,
      };
    }

    const affected = await unblockContents(createdEvent, firewallEvent, {
      transaction: transaction,
    });

    await transaction.query('COMMIT');
    return {
      affected: affected,
      events: events,
    };
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    await transaction.release();
  }
}

const reviewEventTypes = [
  'moderation:block_users',
  'moderation:block_contents:text_root',
  'moderation:block_contents:text_child',
  'moderation:unblock_users',
  'moderation:unblock_contents:text_root',
  'moderation:unblock_contents:text_child',
];

async function validateAndGetFirewallEventToReview(eventId) {
  const reviewingEvent = await event.findOneByOriginalEventId(eventId, {
    types: reviewEventTypes,
  });

  if (reviewingEvent) {
    throw new ValidationError({
      message: 'Você está tentando analisar um evento que já foi analisado.',
      action: 'Utilize um "id" que aponte para um evento de firewall que ainda não foi analisado.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:EVENT_ALREADY_REVIEWED',
      key: 'id',
    });
  }

  const firewallEvent = await event.findOneById(eventId);

  if (!firewallEvent) {
    throw new NotFoundError({
      message: `O id "${eventId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:NOT_FOUND',
      key: 'id',
    });
  }

  const acceptedFirewallEvents = [
    'firewall:block_contents:text_child',
    'firewall:block_contents:text_root',
    'firewall:block_users',
  ];

  if (!acceptedFirewallEvents.includes(firewallEvent.type)) {
    throw new ValidationError({
      message: 'Você está tentando analisar um evento inválido.',
      action: 'Utilize um "id" que aponte para um evento de firewall.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:INVALID_EVENT_TYPE',
      key: 'type',
    });
  }

  return firewallEvent;
}

async function unblockUsers(firewallEvent, options = {}) {
  const users = await user.findAll(
    {
      where: {
        ids: firewallEvent.metadata.users,
      },
    },
    options,
  );
  const inactiveUsers = [];
  const activeUsers = [];

  for (const userData of users) {
    if (userData.features.length === 0) {
      inactiveUsers.push(userData.id);
    } else {
      activeUsers.push(userData.id);
    }
  }

  const affectedUsers = [];

  const updateOptions = {
    ...options,
    withBalance: true,
    ignoreUpdatedAt: true,
  };

  if (activeUsers.length) {
    const updatedUsers = await user.addFeatures(activeUsers, ['create:session', 'read:session'], updateOptions);
    affectedUsers.push(...updatedUsers);
  }
  if (inactiveUsers.length) {
    const updatedUsers = await user.addFeatures(inactiveUsers, ['read:activation_token'], updateOptions);
    affectedUsers.push(...updatedUsers);
  }

  return affectedUsers;
}

async function unblockContents(createdEvent, firewallEvent, options) {
  const affectedContents = await content.undoFirewallStatus(firewallEvent.metadata.contents, options);

  const balanceOperations = await balance.findAllByOriginatorId(firewallEvent.id, options);

  for (const operation of balanceOperations) {
    await balance.undo(operation, { ...options, event: createdEvent });
  }

  const usersIds = new Set();

  for (const content of affectedContents) {
    usersIds.add(content.owner_id);
  }

  let affectedUsers = [];

  if (usersIds.size) {
    affectedUsers = await user.findAll(
      {
        where: {
          ids: Array.from(usersIds),
        },
      },
      options,
    );
  }

  return {
    contents: affectedContents,
    users: affectedUsers,
  };
}

async function findByEventId(eventId) {
  const foundOriginalEvent = await event.findOneById(eventId);

  const firewallEvents = [
    'firewall:block_contents:text_child',
    'firewall:block_contents:text_root',
    'firewall:block_users',
  ];

  if (!foundOriginalEvent || !firewallEvents.includes(foundOriginalEvent.type)) {
    throw new NotFoundError({
      message: `O id "${eventId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
      key: 'id',
    });
  }

  const foundReviewedEvent = await event.findOneByOriginalEventId(eventId, {
    type: reviewEventTypes,
  });

  const events = [foundOriginalEvent];

  if (foundReviewedEvent) {
    events.push(foundReviewedEvent);
  }
  const affectedData = await getAffectedData(events.at(-1));

  return {
    affected: affectedData,
    events: events,
  };
}

async function getAffectedData(event) {
  if (event.type.endsWith('block_users')) {
    const users = await user.findAll({
      where: {
        id: event.metadata.users,
      },
    });
    return { users };
  }

  const contents = await content.findAll({
    where: {
      ids: event.metadata.contents,
    },
  });

  const ownersIds = new Set();

  for (const content of contents) {
    ownersIds.add(content.owner_id);
  }

  const users = await user.findAll({
    where: {
      id: Array.from(ownersIds),
    },
  });

  return {
    contents: contents,
    users: users,
  };
}

export default Object.freeze({
  canRequest,
  findByEventId,
  reviewEvent,
});
