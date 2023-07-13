const byContentId = `
WITH content_events AS (
  SELECT
    id,
    type
  FROM
    events
  WHERE
    metadata ->> 'id' = $1
    OR metadata ->> 'content_id' = $1
)
SELECT
  amount,
  content_events.type
FROM
  balance_operations
INNER JOIN
  content_events
ON balance_operations.originator_id = content_events.id
WHERE balance_type = 'user:tabcoin'
;
`;

const byUserId = `
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
  byContentId,
  byUserId,
});
