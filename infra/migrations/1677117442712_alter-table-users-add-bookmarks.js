exports.up = async (pgm) => {
  await pgm.addColumns('users', {
    bookmarks: {
      type: 'varchar[]',
      notNull: true,
      default: `{}`,
    },
  });
};

exports.down = false;
