exports.up = (pgm) => {
  pgm.createTable('activate_account_tokens', {
    id: {
      type: 'uuid',
      default: pgm.func('uuid_generate_v4()'),
      notNull: true,
      primaryKey: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
    },

    used: {
      type: 'boolean',
      notNull: true,
      default: false,
    },

    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
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
  pgm.dropTable('activate_account_tokens');
};
