exports.up = (pgm) => {
  pgm.addColumns('users', {
    rewarded_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['rewarded_at']);
};
