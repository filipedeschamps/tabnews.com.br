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
    event_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    recipient_id: {
      type: 'uuid',
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
      check: "status IN ('unread', 'read', 'draft')",
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

exports.down = false;
