import database from 'infra/database.js';
import validator from 'models/validator.js';

async function create(options) {
  options = validateOptions(options);

  const query = {
    text: `INSERT INTO events (type, originator_user_id, originator_ip, metadata)
               VALUES($1, $2, $3, $4) RETURNING *;`,
    values: [options.type, options.originatorUserId, options.originatorIp, options.metadata],
  };

  const results = await database.query(query);
  return results.rows[0];

  function validateOptions(options) {
    const cleanOptions = validator(options, {
      event: 'required',
    });

    return cleanOptions;
  }
}

async function findAll() {
  const results = await database.query('SELECT * FROM events;');
  return results.rows;
}

export default Object.freeze({
  create,
  findAll,
});
