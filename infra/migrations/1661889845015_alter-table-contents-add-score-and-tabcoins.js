exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    score: {
      type: 'decimal',
      notNull: false,
    },
    tabcoins: {
      type: 'integer',
      notNull: false,
    },
  });

  await pgm.createIndex('contents', ['score', 'published_at'], {
    name: 'contents_score_published_at_index',
  });
};

exports.down = false;
