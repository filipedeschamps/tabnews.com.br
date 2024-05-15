import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import event from 'models/event';
import user from 'models/user';

import eventTypes from './event-types';

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

async function validateAndGetFirewallEventToReview(eventId) {
  const reviewingEvent = await event.findOneByOriginalEventId(eventId, {
    types: eventTypes.review,
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

  if (!eventTypes.firewall.includes(firewallEvent.type)) {
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

export default Object.freeze({
  reviewEvent,
});
