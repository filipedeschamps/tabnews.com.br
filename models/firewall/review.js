import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import event from 'models/event';
import user from 'models/user';

import eventTypes from './event-types';
import firewallFind from './find';

const reviewFunctions = {
  'moderation:block_users': confirmBlockUsers,
  'moderation:block_contents:text_root': confirmBlockContents,
  'moderation:block_contents:text_child': confirmBlockContents,
  'moderation:unblock_users': unblockUsers,
  'moderation:unblock_contents:text_root': unblockContents,
  'moderation:unblock_contents:text_child': unblockContents,
};

async function reviewEvent({ action, eventId, originatorIp, originatorUserId }) {
  const relatedEvents = await validateAndGetRelatedEventsToReview(eventId);

  const users = new Set();
  const contents = new Set();

  for (const firewallEvent of relatedEvents) {
    firewallEvent.metadata.users?.forEach((userId) => users.add(userId));
    firewallEvent.metadata.contents?.forEach((contentId) => contents.add(contentId));
  }

  const metadata = {
    related_events: relatedEvents.map((e) => e.id),
    users: users.size ? Array.from(users) : undefined,
    contents: contents.size ? Array.from(contents) : undefined,
  };

  const eventType = eventTypes.reviewByAction[action][relatedEvents[0].type];

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const createdEvent = await event.create(
      {
        type: eventType,
        originator_user_id: originatorUserId,
        originator_ip: originatorIp,
        metadata,
      },
      {
        transaction,
      },
    );

    const events = [...relatedEvents, createdEvent];

    const affected = await reviewFunctions[eventType]({
      transaction,
      event: createdEvent,
    });

    await transaction.query('COMMIT');

    return {
      affected,
      events,
    };
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    await transaction.release();
  }
}

async function validateAndGetRelatedEventsToReview(eventId) {
  const relatedEvents = await firewallFind.findAllRelatedEvents(eventId);

  if (!relatedEvents.length) {
    throw new NotFoundError({
      message: `O id "${eventId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:NOT_FOUND',
      key: 'id',
    });
  }

  const reviewingEvent = relatedEvents.find((e) => eventTypes.review.includes(e.type));

  if (reviewingEvent) {
    throw new ValidationError({
      message: 'Você está tentando analisar um evento que já foi analisado.',
      action: 'Utilize um "id" que aponte para um evento de firewall que ainda não foi analisado.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:EVENT_ALREADY_REVIEWED',
      key: 'id',
    });
  }

  return relatedEvents;
}

async function confirmBlockUsers(options) {
  const affectedUsers = await user.addFeatures(options.event.metadata.users, ['nuked'], {
    ...options,
    withBalance: true,
    ignoreUpdatedAt: true,
  });
  return {
    users: affectedUsers,
  };
}

async function confirmBlockContents(options) {
  const affectedContents = await content.confirmFirewallStatus(options.event.metadata.contents, options);

  const usersIds = new Set();

  for (const content of affectedContents) {
    usersIds.add(content.owner_id);
  }

  let affectedUsers = [];

  if (usersIds.size) {
    affectedUsers = await user.findAll(
      {
        where: {
          id: Array.from(usersIds),
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

async function unblockUsers(options) {
  const users = await user.findAll(
    {
      where: {
        id: options.event.metadata.users,
      },
    },
    options,
  );
  const inactiveUsers = [];
  const activeUsers = [];

  for (const userData of users) {
    if (userData.features.length === 0 || (userData.features.length === 1 && userData.features[0] === 'nuked')) {
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

  return {
    users: affectedUsers,
  };
}

async function unblockContents(options) {
  const affectedContents = await content.undoFirewallStatus(options.event.metadata.contents, options);

  const balanceOperations = await balance.findAllByOriginatorId(options.event.metadata.related_events, options);

  for (const operation of balanceOperations) {
    await balance.undo(operation, options);
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
          id: Array.from(usersIds),
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

export default Object.freeze({
  reviewEvent,
});
