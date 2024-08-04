import { NotFoundError } from 'errors';
import database from 'infra/database';
import content from 'models/content';
import user from 'models/user';

import eventTypes from './event-types';

async function findByEventId(eventId) {
  const relatedEvents = await findAllRelatedEvents(eventId);
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

  const affectedData = await getAffectedData(relatedEvents);

  return {
    affected: affectedData,
    events: relatedEvents,
  };
}

async function getAffectedData(events) {
  const usersIds = new Set();
  const contentsIds = new Set();
  const affectedData = {};

  for (const event of events) {
    event.metadata.users?.forEach((userId) => usersIds.add(userId));
    event.metadata.contents?.forEach((contentId) => contentsIds.add(contentId));
  }

  if (contentsIds.size) {
    affectedData.contents = await content.findAll({
      where: {
        id: Array.from(contentsIds),
      },
    });

    for (const content of affectedData.contents) {
      usersIds.add(content.owner_id);
    }
  }

  affectedData.users = await user.findAll({
    where: {
      id: Array.from(usersIds),
    },
  });

  return affectedData;
}

async function findAllRelatedEvents(id) {
  const query = {
    text: `
    WITH RECURSIVE related_events AS (
      SELECT
        id,
        jsonb_array_elements_text(metadata->'contents') AS content_id,
        jsonb_array_elements_text(metadata->'users') AS user_id
      FROM
        events
      WHERE
        id = $1

    UNION

      SELECT
        e.id,
        jsonb_array_elements_text(e.metadata->'contents') AS content_id,
        jsonb_array_elements_text(e.metadata->'users') AS user_id
      FROM
        events e
      INNER JOIN related_events ON
        e.metadata->'contents' ? related_events.content_id OR
        e.metadata->'users' ? related_events.user_id
    )

    SELECT DISTINCT
      events.*
    FROM
      events
    INNER JOIN related_events ON
      events.id = related_events.id
    ;`,
    values: [id],
  };

  const results = await database.query(query);
  return results.rows;
}

export default Object.freeze({
  findAllRelatedEvents,
  findByEventId,
});
