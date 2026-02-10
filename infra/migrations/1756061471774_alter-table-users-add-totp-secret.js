exports.up = (pgm) => {
  pgm.addColumns('users', {
    totp_secret: {
      type: 'varchar(120)',
      notNull: false,
    },
  });
};

exports.down = false;
