exports.up = async (pgm) => {
  pgm.createTable('sponsored_contents', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },

    content_id: {
      type: 'uuid',
      notNull: true,
    },

    deactivate_at: {
      type: 'timestamp with time zone',
      notNull: false,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },

    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  pgm.createTable('sponsored_content_tabcoin_operations', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
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

  pgm.createTable('sponsored_content_tabcash_operations', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
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
    'get_sponsored_content_current_tabcoins',
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
      FROM sponsored_content_tabcoin_operations
      WHERE
        recipient_id = recipient_id_input
        AND (balance_type = 'credit' OR balance_type = 'initial');

      RETURN total_tabcoins;
    END;
  `,
  );

  pgm.createFunction(
    'get_sponsored_content_current_tabcash',
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
      FROM sponsored_content_tabcash_operations
      WHERE
        recipient_id = recipient_id_input;

      RETURN total_tabcash;
    END;
  `,
  );

  pgm.dropConstraint('contents', 'contents_status_check');
  pgm.addConstraint(
    'contents',
    'contents_status_check',
    "CHECK (status IN ('draft', 'published', 'deleted', 'sponsored'))",
  );

  pgm.createIndex('sponsored_contents', ['content_id']);

  pgm.createIndex('sponsored_content_tabcoin_operations', ['recipient_id']);
  pgm.createIndex('sponsored_content_tabcash_operations', ['recipient_id']);
};

exports.down = async (pgm) => {
  pgm.dropConstraint('contents', 'contents_status_check');
  pgm.addConstraint('contents', 'contents_status_check', "CHECK (status IN ('draft', 'published', 'deleted'))");

  pgm.dropFunction(
    'get_sponsored_content_current_tabcoins',
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
    'get_sponsored_content_current_tabcash',
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
