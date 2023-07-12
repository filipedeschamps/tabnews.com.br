exports.up = async (pgm) => {
  await pgm.addColumns('users', {
    description: {
      type: 'varchar(160)',
    },
  });
};

exports.down = false;
