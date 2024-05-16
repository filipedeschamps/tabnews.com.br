exports.up = (pgm) => {
  pgm.createTable('user_notifications', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },
    type: {
      type: 'varchar(30)',
      notNull: true,
    },
    from_id: {
      type: 'uuid',
      notNull: true,
    },
    to_id: {
      type: 'uuid',
      notNull: true,
    },
    to_username: {
      type: 'varchar(30)',
      notNull: true,
    },
    to_email: {
      type: 'varchar(254)',
      notNull: true,
    },
    body_reply_line: {
      type: 'varchar',
      notNull: true,
    },
    content_link: {
      type: 'varchar',
      notNull: true,
    },
    status: {
      type: 'varchar',
      default: 'unread',
      notNull: true,
      check: "status IN ('unread', 'read')",
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
};

exports.down = (pgm) => {
  pgm.dropTable('user_notifications');
};
