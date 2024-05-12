exports.up = (pgm) => {
  pgm.createTable('users_username_changes', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },
    username: {
      type: 'varchar(30)',
      notNull: true,
      unique: true,
    },
    owner_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
    },
    old_usernames: {
      type: 'varchar(30)[]',
      notNull: true,
      default: '{}',
    },
    new_username_change_limit: {
      type: 'integer',
      notNull: true,
      default: 5,
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users_username_changes');
};
