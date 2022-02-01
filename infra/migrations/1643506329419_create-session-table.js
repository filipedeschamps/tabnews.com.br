exports.up = (pgm) => {
  pgm.createTable('sessions', {
    id: {
      type: 'varchar',
      default: pgm.func('uuid_generate_v4()'),
      notNull: true,
      primaryKey: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
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
  pgm.dropTable('sessions');
};
