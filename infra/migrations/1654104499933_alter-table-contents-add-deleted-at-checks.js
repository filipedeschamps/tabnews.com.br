exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    deleted_at: {
      type: 'timestamp with time zone',
      notNull: false,
    },
  });

  await pgm.dropConstraint('contents', 'contents_status_check');
  pgm.addConstraint('contents', 'contents_status_check', "CHECK (status IN ('draft', 'published', 'deleted'))");

  await pgm.dropConstraint('contents', 'contents_uniqueness_fkey');
  await pgm.createIndex('contents', ['owner_id', 'slug', '(deleted_at IS NULL)'], {
    name: 'contents_owner_id_slug_deleted_at_unique_index',
    unique: true,
    where: 'deleted_at IS NULL',
  });
};

exports.down = false;
