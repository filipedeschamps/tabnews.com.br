/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex('contents', [{ name: 'title', opclass: 'gin_trgm_ops' }], {
    name: 'content_titles_trigrams_idx',
    method: 'gin',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('contents', 'title');
};
