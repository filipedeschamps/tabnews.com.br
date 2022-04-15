exports.up = async (pgm) => {
  await pgm.createTable('contents', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
    },

    owner_id: {
      type: 'uuid',
      notNull: true,
    },

    parent_id: {
      type: 'uuid',
      notNull: false,
    },

    slug: {
      type: 'varchar(60)',
    },

    title: {
      type: 'varchar(60)',
    },

    body: {
      type: 'text',
      notNull: true,
    },

    status: {
      type: 'varchar(20)',
      default: 'draft',
      notNull: true,
    },

    source_url: {
      type: 'varchar(100)',
      notNull: false,
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

exports.down = async (pgm) => {
  await pgm.dropTable('contents');
};
