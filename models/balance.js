import { UnprocessableEntityError } from 'errors';
import database from 'infra/database.js';

async function findOne(operationId, options = {}) {
  const query = {
    text: `
      SELECT
        *
      FROM
        balance_operations
      WHERE
        id = $1
      LIMIT
        1
    ;`,
    values: [operationId],
  };

  const results = await database.query(query, options);
  return results.rows[0];
}

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

async function getContentTabcoinsCreditDebit({ recipientId }, options = {}) {
  const query = {
    text: 'SELECT * FROM get_content_balance_credit_debit($1);',
    values: [recipientId],
  };

  const results = await database.query(query, options);
  return {
    tabcoins: results.rows[0].total_balance,
    tabcoins_credit: results.rows[0].total_credit,
    tabcoins_debit: results.rows[0].total_debit,
  };
}

async function rateContent({ contentId, contentOwnerId, fromUserId, transactionType }, options = {}) {
  const tabCoinsToDebitFromUser = -2;
  const tabCashToCreditToUser = 1;
  const tabCoinsToTransactToContentOwner = transactionType === 'credit' ? 1 : -1;
  const tabCoinsToTransactToContent = transactionType === 'credit' ? 1 : -1;
  const originatorType = 'event';
  const originatorId = options.eventId;
  const contentBalanceType = transactionType === 'credit' ? 'content:tabcoin:credit' : 'content:tabcoin:debit';

  const query = {
    text: `
      WITH users_inserts AS (
        INSERT INTO balance_operations
          (balance_type, recipient_id, amount, originator_type, originator_id)
        VALUES
          ('user:tabcoin', $1, $2, $8, $9),
          ('user:tabcash', $1, $3, $8, $9),
          ('user:tabcoin', $6, $7, $8, $9)
        RETURNING
          *
      ),
      content_insert AS (
        INSERT INTO balance_operations
          (balance_type, recipient_id, amount, originator_type, originator_id)
        VALUES
          ($10, $4, $5, $8, $9)
        RETURNING
          *
      )
      SELECT
        get_current_balance('user:tabcoin', $1) AS user_current_tabcoin_balance,
        tabcoins_count.total_balance as content_current_tabcoin_balance,
        tabcoins_count.total_credit as content_current_tabcoin_credit,
        tabcoins_count.total_debit as content_current_tabcoin_debit 
      FROM
        users_inserts,
        content_insert,
        get_content_balance_credit_debit(content_insert.recipient_id) tabcoins_count
      LIMIT
        1
    ;`,
    values: [
      fromUserId, // $1
      tabCoinsToDebitFromUser, // $2
      tabCashToCreditToUser, // $3

      contentId, // $4
      tabCoinsToTransactToContent, // $5

      contentOwnerId, // $6
      tabCoinsToTransactToContentOwner, // $7

      originatorType, // $8
      originatorId, // $9

      contentBalanceType, // $10
    ],
  };

  const results = await database.query(query, options);
  const currentBalances = results.rows[0];

  if (currentBalances.user_current_tabcoin_balance < 0) {
    throw new UnprocessableEntityError({
      message: `Não foi possível adicionar TabCoins nesta publicação.`,
      action: `Você precisa de pelo menos ${Math.abs(tabCoinsToDebitFromUser)} TabCoins para realizar esta ação.`,
      errorLocationCode: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
    });
  }

  return {
    tabcoins: currentBalances.content_current_tabcoin_balance,
    tabcoins_credit: currentBalances.content_current_tabcoin_credit,
    tabcoins_debit: currentBalances.content_current_tabcoin_debit,
  };
}

async function undo(operationId, options = {}) {
  const balanceOperation = await findOne(operationId, options);

  const invertedBalanceOperation = {
    balanceType: balanceOperation.balance_type,
    recipientId: balanceOperation.recipient_id,
    amount: balanceOperation.amount * -1,
    originatorType: 'event',
    originatorId: options.event.id,
  };

  const newBalanceOperation = await create(invertedBalanceOperation, options);
  return newBalanceOperation;
}

export default Object.freeze({
  findOne,
  create,
  getTotal,
  getContentTabcoinsCreditDebit,
  rateContent,
  undo,
});
