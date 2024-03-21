import database from 'infra/database';

async function create({ balanceType, contentId, amount, originatorType, originatorId }, options) {
  const query = {
    text: `
      INSERT INTO content_tabcoin_operations
        (balance_type, content_id, amount, originator_type, originator_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING * ;
      `,
    values: [balanceType, contentId, amount, originatorType, originatorId],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

async function getTabcoinsCreditDebit({ contentId }, options) {
  const query = {
    text: 'SELECT * FROM get_content_tabcoins_credit_debit($1);',
    values: [contentId],
  };

  const results = await database.query(query, options);
  return {
    tabcoins: results.rows[0].total_tabcoins,
    tabcoins_credit: results.rows[0].total_credit,
    tabcoins_debit: results.rows[0].total_debit,
  };
}

async function undoAllByOriginatorId(originatorId, options) {
  const query = {
    text: `
      INSERT INTO content_tabcoin_operations
        (balance_type, content_id, amount, originator_type, originator_id)
      SELECT
        balance_type,
        content_id,
        amount * -1,
        'event',
        $1
      FROM
        content_tabcoin_operations
      WHERE
        originator_id = $2
      RETURNING *;
     `,
    values: [options.event.id, originatorId],
  };

  const results = await database.query(query, options);
  return results.rows;
}

export default Object.freeze({
  create,
  getTabcoinsCreditDebit,
  undoAllByOriginatorId,
});
