exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    root_id: {
      type: 'uuid',
      notNull: false,
    },
  });

  pgm.addConstraint('contents', 'root_id_fkey', 'FOREIGN KEY (root_id) REFERENCES contents(id)');

  await pgm.createIndex('contents', 'root_id', { name: 'contents_root_id_index' });
};

exports.down = async (pgm) => {
  await pgm.dropConstraint('contents', 'root_id_fkey');

  await pgm.dropIndex('contents', 'root_id', { name: 'contents_root_id_index' });

  await pgm.dropColumns('contents', {
    root_id: {
      type: 'uuid',
      notNull: false,
    },
  });
};
