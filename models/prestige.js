import database from 'infra/database';

async function getByContentId(contentId, { transaction } = {}) {
  const result = await database.query(
    {
      text: queryByContentId,
      values: [contentId],
    },
    { transaction }
  );
  return result.rows[0].amount;
}

const queryByContentId = `
SELECT
  amount
FROM
  balance_operations
WHERE
  originator_id IN (
    SELECT
      originator_id
    FROM
      balance_operations
    WHERE 
      recipient_id = $1
      AND balance_type = 'content:tabcoin'
    ORDER BY
      created_at ASC
    LIMIT 1
  )
  AND balance_type = 'user:tabcoin'
LIMIT 1
;
`;

async function getByUserId(
  userId,
  {
    timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    isRoot,
    limit = 10,
    transaction,
  } = {}
) {
  const result = await database.query(
    {
      text: queryByUserId,
      values: [userId, timeOffset, isRoot, limit],
    },
    { transaction }
  );

  const length = result.rows?.length;

  if (!length) {
    return 0;
  }

  const tabcoins = result.rows.reduce((acc, { tabcoins }) => acc + tabcoins, 0);
  const mean = tabcoins / length;

  if (isRoot) {
    if (0.4 >= mean) return -1;
    if (1.2 >= mean) return 0;
    if (1.7 >= mean) return 1;
  } else {
    if (0.2 >= mean) return -1;
    if (1.0 >= mean) return 0;
    if (1.5 >= mean) return 1;
  }

  return Math.ceil(mean);
}

const queryByUserId = `
WITH content_window AS ((
  SELECT
    id,
    published_at
  FROM contents
  WHERE
    owner_id = $1
    AND status = 'published'
    AND (CASE
      WHEN $3 IS TRUE THEN parent_id IS NULL
      WHEN $3 IS FALSE THEN parent_id IS NOT NULL
      ELSE TRUE
      END)
  ORDER BY
    published_at DESC
  LIMIT $4 OFFSET $4
)
UNION
  SELECT
    id,
    published_at
  FROM
    contents
  WHERE
    owner_id = $1
    AND status = 'published'
    AND published_at < $2
    AND (CASE
      WHEN $3 IS TRUE THEN parent_id IS NULL
      WHEN $3 IS FALSE THEN parent_id IS NOT NULL
      ELSE TRUE
      END)
  ORDER BY
    published_at DESC
  LIMIT $4
)
SELECT
  get_current_balance('content:tabcoin', content_window.id) as tabcoins
FROM
  content_window
ORDER BY
  published_at DESC
LIMIT $4
;
`;

export default Object.freeze({
  getByContentId,
  getByUserId,
});
