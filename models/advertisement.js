import database from 'infra/database';

async function getRandom(limit, options = {}) {
  const { ignoreId, ownerId, tryOtherOwners } = options;

  const query = {
    values: [limit],
  };

  let where = "type = 'ad' AND status = 'published'";

  if (ownerId) {
    where += ` AND c.owner_id = '${ownerId}'`;
  }

  if (ignoreId) {
    where += ` AND c.id != '${ignoreId}'`;
  }

  query.text = `
    SELECT
      c.id,
      c.slug,
      c.title,
      c.source_url,
      u.username as owner_username,
      'markdown' as ad_type
    FROM contents c
    INNER JOIN users u ON c.owner_id = u.id
    WHERE ${where}
    ORDER BY RANDOM()
    LIMIT $1;
  `;

  const results = await database.query(query);

  if (!results.rows.length && ownerId && tryOtherOwners) {
    return getRandom(limit, { ignoreId });
  }

  return results.rows;
}

export default Object.freeze({
  getRandom,
});
