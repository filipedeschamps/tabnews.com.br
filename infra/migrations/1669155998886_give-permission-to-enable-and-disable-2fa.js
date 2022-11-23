/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`UPDATE users SET features = features || '{"auth:2fa:enable", "auth:2fa:disable"}'`);
};

exports.down = false;
