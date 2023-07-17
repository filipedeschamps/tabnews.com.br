exports.up = async (pgm) => {
  await pgm.addColumns('users', {
    description: {
      type: 'text',
      check: 'length(description) <= 5000',
      notNull: true,
      default: '',
    },
  });
};

exports.down = false;
