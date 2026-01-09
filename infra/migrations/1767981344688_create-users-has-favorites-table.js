/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('users_favorites', {
    user_id: {
      type: 'uuid',
      notNull: true,
    },
    owner_id: {
      type: 'uuid',
      notNull: true,
    },
    slug: {
      type: 'varchar',
      notNull: true,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  pgm.createConstraint('users_favorites', 'users_favorites_uniqueness_fkey', 'UNIQUE ("user_id", "owner_id", "slug")');

  pgm.createIndex('users_favorites', 'user_id', {
    unique: false,
    name: 'users_favorites_user_id_idx',
  });

  pgm.createIndex('users_favorites', ['owner_id', 'slug'], {
    name: 'users_favorites_idx',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropIndex('users_favorites', 'user_id', {
    name: 'users_favorites_user_id_idx',
  });

  pgm.dropIndex('users_favorites', ['owner_id', 'slug'], {
    name: 'users_favorites_idx',
  });

  pgm.dropConstraint('users_favorites', 'users_favorites_uniqueness_fkey');
  pgm.dropTable('users_favorites');
};
