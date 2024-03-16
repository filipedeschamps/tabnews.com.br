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

async function findOneById(eventId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        events
      WHERE
        id = $1
      LIMIT
        1
    ;`,
    values: [eventId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function findOneByOriginalEventId(originalEventId, where = {}) {
  const firstWhereArgumentIndex = 2;
  const whereClause = buildWhereClause(where, firstWhereArgumentIndex);

  const query = {
    text: `
      SELECT
        *
      FROM
        events
      WHERE
        metadata->>'original_event_id' = $1
        ${whereClause.text ? `AND ${whereClause.text}` : ''}
      LIMIT
        1
    ;`,
    values: [originalEventId, ...whereClause.values],
  };

  const results = await database.query(query);
  return results.rows[0];
}

function buildWhereClause(where, nextArgumentIndex) {
  const columnMap = {
    types: 'type',
    originatorUserId: 'originator_user_id',
    originatorIp: 'originator_ip',
  };

  const values = [];
  const conditions = Object.entries(where).map(([key, value]) => {
    values.push(value);
    const column = columnMap[key] ?? key;
    return Array.isArray(value) ? `${column} = ANY ($${nextArgumentIndex++})` : `${column} = $${nextArgumentIndex++}`;
  });

  return {
    text: `${conditions.join(' AND ')}`,
    values: values,
    nextArgumentIndex: nextArgumentIndex,
  };
}

export default Object.freeze({
  create,
  updateMetadata,
  findOneById,
  findOneByOriginalEventId,
});
