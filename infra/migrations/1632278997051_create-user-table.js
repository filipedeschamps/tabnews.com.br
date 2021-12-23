exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      default: pgm.func('uuid_generate_v4()'),
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
      length: 254,
      notNull: true,
      unique: true,
    },

    // Why 72 in length? https://security.stackexchange.com/a/39851
    password: {
      type: 'varchar(72)',
      notNull: true,
    },

    created_at: {
      type: 'timestamp',
      default: pgm.func("(now() at time zone 'utc')"),
    },

    updated_at: {
      type: 'timestamp',
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
