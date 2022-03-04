exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    // For comparison, GitHub uses a maximum of 39 characters
    username: {
      type: 'varchar(30)',
      notNull: true,
      unique: true,
    },

    // Why 254 in length? https://stackoverflow.com/a/1199238
    email: {
      type: 'varchar(254)',
      notNull: true,
      unique: true,
    },

    // Why 60 varchar? https://forums.phpfreaks.com/topic/293405-recommended-sql-datatype-for-bcrypt-hash/#comment-1500831
    password: {
      type: 'varchar(60)',
      notNull: true,
    },

    features: {
      type: 'varchar[]',
      notNull: true,
      default: `{}`,
    },

    // Why "with timezone"? https://stackoverflow.com/a/20713587
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
  pgm.dropTable('users');
};
