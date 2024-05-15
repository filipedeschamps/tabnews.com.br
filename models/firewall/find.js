import { NotFoundError } from 'errors';
import content from 'models/content';
import event from 'models/event';
import user from 'models/user';

import eventTypes from './event-types';

async function findByEventId(eventId) {
  const foundOriginalEvent = await event.findOneById(eventId);

  if (!foundOriginalEvent || !eventTypes.firewall.includes(foundOriginalEvent.type)) {
    throw new NotFoundError({
      message: `O id "${eventId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
      key: 'id',
    });
  }

  const foundReviewedEvent = await event.findOneByOriginalEventId(eventId, {
    type: eventTypes.review,
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

async function getAffectedData(eventObject) {
  const usersEvents = ['firewall:block_users', 'moderation:block_users', 'moderation:unblock_users'];
  if (usersEvents.includes(eventObject.type)) {
    const users = await user.findAll({
      where: {
        id: eventObject.metadata.users,
      },
    });
    return { users };
  }

  const contents = await content.findAll({
    where: {
      ids: eventObject.metadata.contents,
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
  findByEventId,
});
