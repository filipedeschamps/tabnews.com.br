exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('events', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    type: {
      type: 'text',
      notNull: true,
    },

    originator_user_id: {
      type: 'uuid',
      notNull: true,
    },

    originator_ip: {
      type: 'inet',
      notNull: true,
    },

    metadata: {
      type: 'jsonb',
      notNull: true,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });
};

exports.down = false;
