import database from 'infra/database.js';
import validator from 'models/validator.js';

async function create(object, options = {}) {
  const cleanObject = validateObject(object);

  const query = {
    text: `INSERT INTO events (type, originator_user_id, originator_ip, metadata)
               VALUES($1, $2, $3, $4) RETURNING *;`,
    values: [cleanObject.type, cleanObject.originator_user_id, cleanObject.originator_ip, cleanObject.metadata],
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

export default Object.freeze({
  create,
});
