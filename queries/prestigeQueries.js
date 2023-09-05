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
    AND ($3 != TRUE OR parent_id IS NULL)
  ORDER BY
    published_at DESC
  LIMIT $4 OFFSET $5
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
    AND ($3 != TRUE OR parent_id IS NULL)
  ORDER BY
    published_at DESC
  LIMIT $4
)
SELECT
  get_current_balance('content:tabcoin', content_window.id) as tabcoins
FROM
  content_window
ORDER BY
  published_at ASC
LIMIT $4
;
`;

export default Object.freeze({
  byContentId,
  byUserId,
});
