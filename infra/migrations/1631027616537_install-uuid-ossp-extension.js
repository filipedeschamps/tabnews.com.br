exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', {
    ifNotExists: true,
    schema: 'public',
  });
};

exports.down = (pgm) => {};
