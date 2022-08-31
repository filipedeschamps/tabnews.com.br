exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    score: {
      type: 'decimal',
      notNull: false,
    },
  });

  await pgm.createIndex('contents', ['score', 'created_at'], {
    name: 'contents_score_created_at_index',
  });
};

exports.down = false;
