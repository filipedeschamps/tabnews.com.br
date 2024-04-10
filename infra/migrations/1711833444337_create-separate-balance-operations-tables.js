exports.up = (pgm) => {
  pgm.createTable('content_tabcoin_operations', {
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

    recipient_id: {
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

  pgm.createTable('user_tabcoin_operations', {
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

    recipient_id: {
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

  pgm.createTable('user_tabcash_operations', {
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

    recipient_id: {
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

  pgm.createFunction(
    'get_content_current_tabcoins',
    [
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
      total_tabcoins integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcoins
      FROM content_tabcoin_operations
      WHERE
        recipient_id = recipient_id_input;

      RETURN total_tabcoins;
    END;
  `,
  );

  pgm.createFunction(
    'get_user_current_tabcoins',
    [
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
      total_tabcoins integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcoins
      FROM user_tabcoin_operations
      WHERE
        recipient_id = recipient_id_input;

      RETURN total_tabcoins;
    END;
  `,
  );

  pgm.createFunction(
    'get_user_current_tabcash',
    [
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
    total_tabcash integer;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO total_tabcash
      FROM user_tabcash_operations
      WHERE
        recipient_id = recipient_id_input;

      RETURN total_tabcash;
    END;
  `,
  );

  pgm.createIndex('content_tabcoin_operations', ['recipient_id', 'balance_type']);
  pgm.createIndex('user_tabcoin_operations', ['recipient_id']);
  pgm.createIndex('user_tabcash_operations', ['recipient_id']);
};

exports.down = (pgm) => {
  // Do not drop the created tables to avoid accidentally losing data.

  pgm.dropFunction(
    'get_content_current_tabcoins',
    [
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  pgm.dropFunction(
    'get_user_current_tabcoins',
    [
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );

  pgm.dropFunction(
    'get_user_current_tabcash',
    [
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    { ifExists: true },
  );
};
