/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pg_trgm');
};

exports.down = (pgm) => {
  pgm.dropExtension('pg_trgm');
};
