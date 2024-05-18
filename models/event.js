import snakeize from 'snakeize';

import database from 'infra/database.js';
import validator from 'models/validator.js';

async function create(object, options = {}) {
  const cleanObject = validator(snakeize(object), {
    event: 'required',
  });

  const query = {
    text: `INSERT INTO events (type, originator_user_id, originator_ip, metadata)
               VALUES($1, $2, $3, $4) RETURNING *;`,
    values: [cleanObject.type, cleanObject.originator_user_id, cleanObject.originator_ip, cleanObject.metadata],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

// Currently it only update "metadata" column.
async function updateMetadata(eventId, object, options = {}) {
  object = validateObject(object);

  const query = {
    text: `
      UPDATE
        events
      SET
        metadata = $1
      WHERE
        id = $2
      RETURNING *
    ;`,
    values: [object.metadata, eventId],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

function validateObject(object) {
  const cleanObject = validator(object, {
    event: 'required',
  });

  return cleanObject;
}

async function findAllRelatedEvents(id) {
  const query = {
    text: `
    WITH searched_event AS (
      SELECT
        id,
        metadata
      FROM
        events
      WHERE
        id = $1
      LIMIT
        1
    ),
    same_metadata_events AS (
      SELECT
        ARRAY_AGG(events.id) AS ids
      FROM
        events
      INNER JOIN
        searched_event ON true
      WHERE
        events.metadata @> searched_event.metadata
    )

    SELECT
      events.*
    FROM
      events
    INNER JOIN
      searched_event ON true
    INNER JOIN
      same_metadata_events ON true
    WHERE
      events.id = searched_event.id OR
      events.id = ANY (COALESCE(same_metadata_events.ids, ARRAY[]::uuid[])) OR
      events.metadata->>'original_event_id' = searched_event.id::text OR
      events.metadata->>'original_event_id' = ANY (COALESCE(CAST(same_metadata_events.ids AS text[]), ARRAY[]::text[]))
    ;`,
    values: [id],
  };

  const results = await database.query(query);
  return results.rows;
}

export default Object.freeze({
  create,
  updateMetadata,
  findAllRelatedEvents,
});
