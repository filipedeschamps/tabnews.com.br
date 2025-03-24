exports.up = (pgm) => {
  pgm.addColumns('activate_account_tokens', {
    // Why 254 in length? https://stackoverflow.com/a/1199238
    email: {
      type: 'varchar(254)',
      notNull: false,
      unique: false,
    },
  });
};

exports.down = false;
