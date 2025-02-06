exports.up = (pgm) => {
  pgm.addColumns('users', {
    totp_secret: {
      type: 'varchar(128)',
      notNull: false,
    },
  });
};

exports.down = false;
