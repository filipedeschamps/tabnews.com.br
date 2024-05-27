exports.up = async (pgm) => {
  await pgm.db.query(`
  CREATE INDEX idx_search ON contents USING GIN(to_tsvector('portuguese', coalesce(title, '') || ' ' || body || ' ' || regexp_replace(slug, '-', ' ', 'g')));
`);

  await pgm.db.query(`
  ALTER TABLE contents ADD search tsvector GENERATED ALWAYS AS
  (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') || ' ' ||
    setweight(to_tsvector('portuguese', regexp_replace(slug, '-', ' ', 'g')), 'B') || ' ' ||
    setweight(to_tsvector('portuguese', body), 'C')
  ) STORED;
`);

  await pgm.db.query(`
  CREATE INDEX idx_contents_search ON contents USING GIN(search);
`);
};

exports.down = (pgm) => {
  pgm.dropColumn('contents', 'search', { ifExists: true });

  pgm.dropIndex('contents', 'idx_search', { ifExists: true });

  pgm.dropIndex('contents', 'idx_contents_search', { ifExists: true });
};
