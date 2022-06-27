import database from 'infra/database.js';
import validator from 'models/validator.js';

async function create(object, options = {}) {
  object = validateObject(object);

  const query = {
    text: `INSERT INTO events (type, originator_user_id, originator_ip, metadata)
               VALUES($1, $2, $3, $4) RETURNING *;`,
    values: [object.type, object.originatorUserId, object.originatorIp, object.metadata],
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

async function findAll() {
  const results = await database.query('SELECT * FROM events;');
  return results.rows;
}

export default Object.freeze({
  create,
  updateMetadata,
  findAll,
});
