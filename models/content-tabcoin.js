import database from 'infra/database';

async function findAll(values = {}, options) {
  const where = values.where ?? {};
  const whereClause = buildWhereClause(where);

  const limitClause = values.limit ? `LIMIT ${values.limit}` : '';

  const query = {
    text: `
      SELECT
        *
      FROM
        content_tabcoin_operations
      ${whereClause}
      ${limitClause}
    ;`,
    values: Object.values(where),
  };

  const results = await database.query(query, options);
  return results.rows;

  function buildWhereClause(where) {
    const columnMap = {
      balanceType: 'balance_type',
      contentId: 'content_id',
      originatorType: 'originator_type',
      originatorId: 'originator_id',
    };

    const conditions = Object.entries(where).map(([key, value], _index) => {
      const index = _index + 1;
      const column = columnMap[key] ?? key;
      return Array.isArray(value) ? `${column} = ANY ($${index})` : `${column} = $${index}`;
    });

    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  }
}

async function findOne(operationId, options) {
  const rows = await findAll(
    {
      limit: 1,
      where: {
        id: operationId,
      },
    },
    options,
  );

  return rows[0];
}

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

async function undo(operationId, options) {
  const balanceOperation = await findOne(operationId, options);

  const invertedBalanceOperation = {
    balanceType: balanceOperation.balance_type,
    contentId: balanceOperation.content_id,
    amount: balanceOperation.amount * -1,
    originatorType: 'event',
    originatorId: options.event.id,
  };

  const newBalanceOperation = await create(invertedBalanceOperation, options);
  return newBalanceOperation;
}

export default Object.freeze({
  create,
  findAll,
  findOne,
  getTabcoinsCreditDebit,
  undo,
});
