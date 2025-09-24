exports.up = (pgm) => {
  pgm.createTable('recovery_codes', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    // Why 60 varchar? https://forums.phpfreaks.com/topic/293405-recommended-sql-datatype-for-bcrypt-hash/#comment-1500831
    code: {
      type: 'varchar(60)',
      notNull: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
    },

    valid: {
      type: 'boolean',
      notNull: true,
      default: true,
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
  pgm.dropTable('recovery_codes');
};
