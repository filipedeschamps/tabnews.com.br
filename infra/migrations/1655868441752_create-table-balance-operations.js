exports.up = async (pgm) => {
  await pgm.createTable('balance_operations', {
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
  `
  );
};

exports.down = false;
