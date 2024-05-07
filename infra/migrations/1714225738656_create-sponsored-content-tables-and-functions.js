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

exports.down = false;
