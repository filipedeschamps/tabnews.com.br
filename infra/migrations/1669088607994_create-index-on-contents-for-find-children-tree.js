/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.createIndex('contents', ['id', 'parent_id'], {
    name: 'contents_published_parent_and_children_idx',
    where: "contents.status = 'published'",
    unique: true,
  });

  await pgm.createIndex('users', ['id', 'username'], {
    name: 'users_id_username_idx',
    unique: true,
  });
};

exports.down = (pgm) => async (pgm) => {
  await pgm.dropIndex('contents', ['id', 'username'], {
    name: 'contents_published_parent_and_children_idx',
    unique: true,
  });

  await pgm.dropIndex('users', ['id', 'username'], {
    name: 'users_id_username_idx',
    unique: true,
  });
};
