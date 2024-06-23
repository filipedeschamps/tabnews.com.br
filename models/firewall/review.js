import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import event from 'models/event';
import user from 'models/user';

import eventTypes from './event-types';

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

  const firewallEvent = relatedEvents.find((e) => e.id === eventId);

  const metadata = {
    original_event_id: eventId,
    users: firewallEvent.metadata.users,
    contents: firewallEvent.metadata.contents,
  };

  const eventType = eventTypes.reviewByAction[action][firewallEvent.type];

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const createdEvent = await event.create(
      {
        type: eventType,
        originatorUserId,
        originatorIp,
        metadata,
      },
      {
        transaction,
      },
    );

    const events = [...relatedEvents, createdEvent];

    const affected = await reviewFunctions[eventType](firewallEvent, {
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
  const relatedEvents = await event.findAllRelatedEvents(eventId);

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

  const firewallEvent = relatedEvents.find((e) => e.id === eventId);

  if (!eventTypes.firewall.includes(firewallEvent.type)) {
    throw new ValidationError({
      message: 'Você está tentando analisar um evento inválido.',
      action: 'Utilize um "id" que aponte para um evento de firewall.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:INVALID_EVENT_TYPE',
      key: 'type',
    });
  }

  return relatedEvents;
}

async function confirmBlockUsers(firewallEvent, options) {
  const users = await user.findAll(
    {
      where: {
        ids: firewallEvent.metadata.users,
      },
    },
    options,
  );

  const ids = users.map((userData) => userData.id);

  const affectedUsers = await user.addFeatures(ids, ['nuked'], {
    ...options,
    withBalance: true,
    ignoreUpdatedAt: true,
  });
  return {
    users: affectedUsers,
  };
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

async function unblockUsers(firewallEvent, options) {
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

async function unblockContents(firewallEvent, options) {
  const affectedContents = await content.undoFirewallStatus(firewallEvent.metadata.contents, options);

  const balanceOperations = await balance.findAllByOriginatorId(firewallEvent.id, options);

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

export default Object.freeze({
  reviewEvent,
});
