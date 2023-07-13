exports.up = async (pgm) => {
  await pgm.addColumns('users', {
    description: {
      type: 'text',
      check: 'length(description) <= 20000',
      notNull: true,
      default: '',
    },
  });
};

exports.down = false;
