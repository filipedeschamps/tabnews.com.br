exports.up = async (pgm) => {
  await pgm.createTable('searches', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    search_term: {
      type: 'varchar(255)',
      notNull: true,
    },
    search_count: {
      type: 'integer',
      notNull: true,
      default: 0,
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

  await pgm.createConstraint('searches', 'search_term_unique', {
    unique: 'search_term',
  });

  await pgm.db.query(`
    CREATE INDEX idx_search ON contents USING GIN(to_tsvector('portuguese', title));
  `);

  await pgm.db.query(`
    ALTER TABLE contents 
    ADD COLUMN ts tsvector 
    GENERATED ALWAYS AS (
      setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('portuguese', coalesce(body, '')), 'B')
    ) STORED;
  `);
};

exports.down = async (pgm) => {
  await pgm.dropConstraint('searches', 'search_term_unique', { ifExists: true });

  await pgm.dropTable('searches', { ifExists: true });

  await pgm.dropIndex('contents', 'idx_search', { ifExists: true });

  await pgm.dropColumn('contents', 'ts', { ifExists: true });
};
