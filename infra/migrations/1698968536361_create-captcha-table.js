/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('captchas', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    token: {
      type: 'varchar(60)',
      notNull: true,
    },

    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },

    used: {
      type: 'boolean',
      notNull: true,
      default: false,
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
};

exports.down = (pgm) => {
  pgm.dropTable('captchas');
};
