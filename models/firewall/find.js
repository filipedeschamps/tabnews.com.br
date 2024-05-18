import { NotFoundError } from 'errors';
import content from 'models/content';
import event from 'models/event';
import user from 'models/user';

import eventTypes from './event-types';

async function findByEventId(eventId) {
  const relatedEvents = await event.findAllRelatedEvents(eventId);
  const foundRequestedEvent = relatedEvents.find((event) => event.id === eventId);

  if (!foundRequestedEvent || !eventTypes.firewall.includes(foundRequestedEvent.type)) {
    throw new NotFoundError({
      message: `O id "${eventId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
      key: 'id',
    });
  }

  const affectedData = await getAffectedData(relatedEvents.at(-1));

  return {
    affected: affectedData,
    events: relatedEvents,
  };
}

async function getAffectedData(eventObject) {
  if (eventTypes.users.includes(eventObject.type)) {
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
