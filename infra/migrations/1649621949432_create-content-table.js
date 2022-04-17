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
      type: 'varchar(200)',
    },

    title: {
      type: 'varchar(256)',
    },

    body: {
      type: 'varchar(20000)',
      notNull: true,
    },

    status: {
      type: 'varchar(20)',
      default: 'draft',
      notNull: true,
    },

    source_url: {
      type: 'varchar(2000)',
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

  await pgm.addConstraint(
    'contents',
    'contents_owner_id_and_slug_fkey',
    'UNIQUE ("owner_id", "slug")'
  );

  await pgm.addConstraint(
    'contents',
    'contents_status_check',
    'CHECK ("status" = ANY (ARRAY[\'draft\', \'published\', \'unpublished\', \'deleted\']))'
  );

};

exports.down = async (pgm) => {
  await pgm.dropConstraint('contents', 'contents_status_check');
  await pgm.dropConstraint('contents', 'contents_owner_id_and_slug_fkey');
  await pgm.dropTable('contents');
};
