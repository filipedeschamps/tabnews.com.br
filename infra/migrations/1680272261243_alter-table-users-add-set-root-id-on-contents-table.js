/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  const query = `WITH RECURSIVE find_root(id, root_id) AS (
                  SELECT id, id as root_id FROM contents WHERE parent_id IS NULL
                  UNION ALL
                  SELECT c.id, r.root_id FROM contents c JOIN find_root r ON r.id = c.parent_id
                )
                UPDATE contents c SET root_id = r.root_id FROM find_root r WHERE c.id = r.id;
  `;
  await pgm.sql(query);
};

exports.down = async (pgm) => {
  const query = 'UPDATE contents SET root_id = NULL';

  await pgm.sql(query);
};
