exports.up = async (pgm) => {
  await pgm.createTable('content_tabcoin_operations', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    sequence: {
      type: 'serial',
      notNull: true,
    },

    balance_type: {
      type: 'text',
      notNull: true,
    },

    content_id: {
      type: 'uuid',
      notNull: true,
    },

    amount: {
      type: 'integer',
      notNull: true,
    },

    originator_type: {
      type: 'text',
      notNull: true,
    },

    originator_id: {
      type: 'uuid',
      notNull: true,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  await pgm.createTable('user_tabcoin_operations', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    sequence: {
      type: 'serial',
      notNull: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
    },

    amount: {
      type: 'integer',
      notNull: true,
    },

    originator_type: {
      type: 'text',
      notNull: true,
    },

    originator_id: {
      type: 'uuid',
      notNull: true,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  await pgm.createTable('user_tabcash_operations', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    sequence: {
      type: 'serial',
      notNull: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
    },

    amount: {
      type: 'integer',
      notNull: true,
    },

    originator_type: {
      type: 'text',
      notNull: true,
    },

    originator_id: {
      type: 'uuid',
      notNull: true,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  await pgm.createFunction(
    'get_content_current_tabcoins',
    [
      {
        name: 'content_id_input',
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
      total_tabcoins integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcoins
      FROM content_tabcoin_operations
      WHERE
        content_id = content_id_input;

      RETURN total_tabcoins;
    END;
  `,
  );

  await pgm.createFunction(
    'get_user_current_tabcoins',
    [
      {
        name: 'user_id_input',
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
      total_tabcoins integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcoins
      FROM user_tabcoin_operations
      WHERE
        user_id = user_id_input;

      RETURN total_tabcoins;
    END;
  `,
  );

  await pgm.createFunction(
    'get_user_current_tabcash',
    [
      {
        name: 'user_id_input',
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
    total_tabcash integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcash
      FROM user_tabcash_operations
      WHERE
        user_id = user_id_input;

      RETURN total_tabcash;
    END;
  `,
  );

  await pgm.createFunction(
    'get_content_tabcoins_credit_debit',
    [
      {
        name: 'content_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    {
      returns: 'TABLE (total_tabcoins BIGINT, total_credit BIGINT, total_debit BIGINT) ROWS 1',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      RETURN QUERY
        SELECT
          COALESCE(SUM(amount), 0) AS total_tabcoins,
          COALESCE(SUM(CASE WHEN balance_type = 'credit' THEN amount END), 0) AS total_credit,
          COALESCE(SUM(CASE WHEN balance_type = 'debit' THEN amount END), 0) AS total_debit
        FROM
          content_tabcoin_operations
        WHERE
          content_id = content_id_input;
    END;
  `,
  );

  await pgm.createIndex('content_tabcoin_operations', ['content_id', 'balance_type']);
  await pgm.createIndex('user_tabcoin_operations', ['user_id']);
  await pgm.createIndex('user_tabcash_operations', ['user_id']);
};

exports.down = async (pgm) => {
  // Do not drop the created tables to avoid accidentally losing data.

  await pgm.dropFunction(
    'get_content_current_tabcoins',
    [
      {
        name: 'content_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  await pgm.dropFunction(
    'get_user_current_tabcoins',
    [
      {
        name: 'user_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  await pgm.dropFunction(
    'get_user_current_tabcash',
    [
      {
        name: 'user_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  await pgm.dropFunction(
    'get_content_tabcoins_credit_debit',
    [
      {
        name: 'content_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );
};
