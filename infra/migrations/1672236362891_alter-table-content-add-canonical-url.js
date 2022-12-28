/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    canonical_url: {
      type: 'varchar',
      check: 'length(source_url) <= 2000',
      notNull: false,
    },
  });
};

exports.down = false;
