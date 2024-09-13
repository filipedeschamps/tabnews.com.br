exports.up = (pgm) => {
  pgm.addColumns('users', {
    totp_recovery_codes: {
      type: 'varchar(416)',
      notNull: false,
    },
  });
};

exports.down = false;
