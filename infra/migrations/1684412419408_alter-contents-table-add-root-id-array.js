exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    path: {
      type: 'uuid[]',
      notNull: true,
      default: '{}',
    },
  });

  await pgm.createIndex('contents', 'path', {
    name: 'contents_path_idx',
    method: 'gin',
  });
};

exports.down = false;
