import database from 'infra/database';

async function getRandom(limit) {
  const query = {
    values: [limit],
  };

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
    WHERE type = 'ad' AND status = 'published'
    ORDER BY RANDOM()
    LIMIT $1;
  `;

  const results = await database.query(query);

  return results.rows;
}

export default Object.freeze({
  getRandom,
});
