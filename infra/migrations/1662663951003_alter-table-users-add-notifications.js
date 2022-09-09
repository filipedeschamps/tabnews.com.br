exports.up = async (pgm) => {
  await pgm.addColumns('users', {
    notifications: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
  });
};

exports.down = false;
