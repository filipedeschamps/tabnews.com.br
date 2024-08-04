exports.up = (pgm) => {
  pgm.dropTable('balance_operations');

  pgm.dropFunction(
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
    { ifExists: true },
  );
};

exports.down = (pgm) => {
  pgm.createTable('balance_operations', {
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

  pgm.createFunction(
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

  pgm.createIndex('balance_operations', ['recipient_id', 'balance_type']);
};
