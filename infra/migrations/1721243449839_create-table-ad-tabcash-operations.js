exports.up = (pgm) => {
  pgm.createType('ad_balance_type_enum', ['budget', 'daily_debit']);

  pgm.createType('originator_type_enum', ['event', 'user']);

  pgm.createTable('ad_tabcash_operations', {
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
      type: 'ad_balance_type_enum',
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
      type: 'originator_type_enum',
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
    'get_ad_current_tabcash',
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
      FROM ad_tabcash_operations
      WHERE
        recipient_id = recipient_id_input;

      RETURN total_tabcash;
    END;
  `,
  );

  pgm.createIndex('ad_tabcash_operations', ['recipient_id', 'balance_type']);
};

exports.down = false;
