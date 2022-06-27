import database from 'infra/database.js';

async function create({ balanceType, recipientId, amount, originatorType, originatorId }, options = {}) {
  const query = {
    text: `
      INSERT INTO balance_operations
        (balance_type, recipient_id, amount, originator_type, originator_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING * ;
      `,
    values: [balanceType, recipientId, amount, originatorType, originatorId],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

async function getTotal({ balanceType, recipientId }, options = {}) {
  const query = {
    text: 'SELECT get_current_balance($1, $2);',
    values: [balanceType, recipientId],
  };

  const results = await database.query(query, options);
  return results.rows[0].get_current_balance;
}

export default Object.freeze({
  create,
  getTotal,
});
