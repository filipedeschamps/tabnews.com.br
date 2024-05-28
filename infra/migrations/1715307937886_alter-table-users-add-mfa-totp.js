exports.up = (pgm) => {
  pgm.addColumns('users', {
    totp_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    totp_secret: {
      type: 'varchar(128)',
      notNull: false,
    },
  });
};

exports.down = false;
