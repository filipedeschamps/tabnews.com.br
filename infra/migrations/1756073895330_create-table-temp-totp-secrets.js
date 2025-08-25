exports.up = (pgm) => {
  pgm.createTable('temp_totp_secrets', {
    user_id: {
      type: 'uuid',
      notNull: true,
      primaryKey: true,
    },

    totp_secret: {
      type: 'varchar(120)',
      notNull: true,
    },

    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

exports.down = false;
