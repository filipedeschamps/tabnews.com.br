exports.up = (pgm) => {
  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    // // Same as user_id, but I figured out that receiver_id is easier to understand.
    // receiver_id: {
    //   type: 'uuid',
    //   notNull: true,
    // },

    content_id: {
      type: 'uuid',
      notNull: false,
    },

    // read: {
    //   type: 'boolean',
    //   default: false,
    //   notNull: true,
    // },

    type: {
      type: 'varchar',
      notNull: true,
      // I think it is better to restrict the types on the model layer, because it's easier to add more on production.
      // 20 is probably enough.
      check: 'length(type) <= 20',
    },

    parent_id: {
      type: 'uuid',
      notNull: false,
      default: null,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },

    // // This is temporary. I want to know what you think about this.
    // read_at: {
    //   type: 'timestamp with time zone',
    //   notNull: false,
    //   default: null,
    // },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('notifications');
};
