exports.up = async (pgm) => {
  await pgm.createTable('favorites', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
      primaryKey: true,
      unique: true,
    },

    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },

    content_id: {
      type: 'uuid',
      notNull: true,
      references: '"contents"',
      onDelete: 'CASCADE',
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  // Índice único para evitar favoritos duplicados
  await pgm.addConstraint('favorites', 'favorites_user_content_unique', 'UNIQUE ("user_id", "content_id")');

  // Índices para melhor performance
  await pgm.createIndex('favorites', 'user_id');
  await pgm.createIndex('favorites', 'content_id');
  await pgm.createIndex('favorites', 'created_at');
};

exports.down = async (pgm) => {
  await pgm.dropIndex('favorites', 'created_at');
  await pgm.dropIndex('favorites', 'content_id');
  await pgm.dropIndex('favorites', 'user_id');
  await pgm.dropConstraint('favorites', 'favorites_user_content_unique');
  await pgm.dropTable('favorites');
};