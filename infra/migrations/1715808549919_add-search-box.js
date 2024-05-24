exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE INDEX idx_search ON contents USING GIN(to_tsvector('portuguese', title));
  `);

  await pgm.db.query(`
    ALTER TABLE contents 
    ADD COLUMN ts tsvector 
    GENERATED ALWAYS AS (
      setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('portuguese', body), 'B')
    ) STORED;
  `);

  await pgm.db.query(`
    CREATE INDEX idx_contents_ts ON contents USING GIN(ts);
  `);
};

exports.down = async (pgm) => {
  await pgm.dropColumn('contents', 'ts', { ifExists: true });

  await pgm.dropIndex('contents', 'idx_search', { ifExists: true });

  await pgm.dropIndex('contents', 'idx_contents_ts', { ifExists: true });
};
