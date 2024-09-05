exports.up = (pgm) => {
  pgm.dropConstraint('users', 'users_username_key');

  pgm.createIndex('users', 'LOWER(username)', {
    unique: true,
    name: 'users_username_lower_idx',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('users', 'LOWER(username)', {
    name: 'users_username_lower_idx',
  });

  pgm.addConstraint('users', 'users_username_key', {
    unique: ['username'],
  });
};
