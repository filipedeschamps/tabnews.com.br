exports.up = (pgm) => {
  pgm.createFunction(
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
          COALESCE(SUM(CASE WHEN balance_type = 'credit' THEN amount END), 0) AS total_credit,
          COALESCE(SUM(CASE WHEN balance_type = 'debit' THEN amount END), 0) AS total_debit
        FROM
          content_tabcoin_operations
        WHERE
          recipient_id = content_id_input;
    END;
  `,
  );
};

exports.down = (pgm) => {
  pgm.createFunction(
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
};
