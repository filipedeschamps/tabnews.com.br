/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */

exports.up = (pgm) => {
  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
    },
    message: {
      type: 'text',
      notNull: true,
    },
    entity_id: {
      type: 'uuid',
      notNull: true,
      references: '"contents"',
      onDelete: 'CASCADE',
    },
    content_link: {
      type: 'text',
      notNull: true,
    },
    is_read: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', ['user_id', 'is_read']);
  pgm.createIndex('notifications', [{ name: 'created_at', sort: 'DESC' }]);
};

exports.down = (pgm) => {
  pgm.dropTable('notifications');
};
