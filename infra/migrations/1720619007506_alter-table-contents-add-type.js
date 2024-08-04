exports.up = (pgm) => {
  pgm.createType('content_types_enum', ['content', 'pitch', 'ad']);

  pgm.addColumns('contents', {
    type: {
      type: 'content_types_enum',
      notNull: true,
      default: 'content',
    },
  });
};

exports.down = false;
