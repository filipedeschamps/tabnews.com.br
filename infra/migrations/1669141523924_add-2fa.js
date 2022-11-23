/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('users', {
    secret_2fa: {
      type: 'text',
      notNull: false,
    },
  });
};

exports.down = false;
