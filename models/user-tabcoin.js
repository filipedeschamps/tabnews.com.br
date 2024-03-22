import database from 'infra/database';

async function create({ userId, amount, originatorType, originatorId }, options) {
  const query = {
    text: `
      INSERT INTO user_tabcoin_operations
        (user_id, amount, originator_type, originator_id)
      VALUES
        ($1, $2, $3, $4)
      RETURNING * ;
      `,
    values: [userId, amount, originatorType, originatorId],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

async function undoAllByOriginatorId(originatorId, options) {
  const query = {
    text: `
      INSERT INTO user_tabcoin_operations
        (user_id, amount, originator_type, originator_id)
      SELECT
        user_id,
        amount * -1,
        'event',
        $1
      FROM
        user_tabcoin_operations
      WHERE
        originator_id = $2
      RETURNING *;
     `,
    values: [options.event.id, originatorId],
  };

  const results = await database.query(query, options);
  return results.rows;
}

async function getTotal({ userId }, options) {
  const query = {
    text: 'SELECT get_user_current_tabcoins($1);',
    values: [userId],
  };

  const results = await database.query(query, options);
  return results.rows[0].get_user_current_tabcoins;
}

export default Object.freeze({
  create,
  getTotal,
  undoAllByOriginatorId,
});
