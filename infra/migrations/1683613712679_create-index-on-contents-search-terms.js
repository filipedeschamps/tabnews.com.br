exports.up = async (pgm) => {
  await pgm.sql('CREATE EXTENSION unaccent;');
  await pgm.sql("CREATE INDEX search_term_title ON contents using gin(to_tsvector('portuguese', title));");
  await pgm.sql("CREATE INDEX search_term_body ON contents using gin(to_tsvector('portuguese', body));");
};

exports.down = false;
