exports.up = async (pgm) => {
  await pgm.createFunction(
    'get_content_balance_credit_debit',
    [
      {
        name: 'content_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    {
      returns: 'TABLE (total_balance BIGINT, total_credit BIGINT, total_debit BIGINT) ROWS 1',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      RETURN QUERY
        SELECT
          COALESCE(SUM(amount), 0) AS total_balance,
          COALESCE(SUM(CASE WHEN balance_type = 'content:tabcoin:credit' THEN amount END), 0) AS total_credit,
          COALESCE(SUM(CASE WHEN balance_type = 'content:tabcoin:debit' THEN amount END), 0) AS total_debit
        FROM
          balance_operations
        WHERE
          recipient_id = content_id_input;
    END;
  `,
  );

  await pgm.createFunction(
    'get_current_balance',
    [
      {
        name: 'balance_type_input',
        mode: 'IN',
        type: 'text',
      },
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    {
      returns: 'integer',
      language: 'plpgsql',
      replace: true,
    },
    `
    DECLARE
      total_balance integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_balance
      FROM balance_operations
      WHERE
        (CASE
            WHEN balance_type_input = 'content:tabcoin' THEN true
            ELSE balance_type = balance_type_input 
        END)
        AND recipient_id = recipient_id_input;

      RETURN total_balance;
    END;`,
  );

  await pgm.createIndex('balance_operations', ['recipient_id', 'balance_type'], { ifNotExists: true });

  await pgm.dropIndex('balance_operations', ['balance_type', 'recipient_id'], { ifExists: true });
};

exports.down = async (pgm) => {
  await pgm.dropFunction(
    'get_content_balance_credit_debit',
    [
      {
        name: 'content_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  await pgm.createFunction(
    'get_current_balance',
    [
      {
        name: 'balance_type_input',
        mode: 'IN',
        type: 'text',
      },
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    {
      returns: 'integer',
      language: 'plpgsql',
      replace: true,
    },
    `
    DECLARE
      total_balance integer;
    BEGIN
      total_balance := (
        SELECT
          COALESCE(sum(amount), 0)
        FROM
          balance_operations
        WHERE
          balance_type = balance_type_input
          AND recipient_id = recipient_id_input
      );
      RETURN total_balance;
    END;
  `,
  );

  await pgm.dropIndex('balance_operations', ['recipient_id', 'balance_type'], { ifExists: true });

  await pgm.createIndex('balance_operations', ['balance_type', 'recipient_id'], { ifNotExists: true });
};
