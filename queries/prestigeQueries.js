const byContentId = `
WITH content_events AS (
  SELECT
    id,
    originator_user_id,
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
  user_tabcoin_operations
INNER JOIN
  content_events
ON user_tabcoin_operations.originator_id = content_events.id
  AND (user_tabcoin_operations.recipient_id != content_events.originator_user_id
    OR content_events.type = 'create:content:text_root'
    OR content_events.type = 'create:content:text_child')
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
    AND type = 'content'
    AND ($3 = FALSE OR parent_id IS NULL)
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
    AND type = 'content'
    AND published_at < $2
    AND ($3 = FALSE OR parent_id IS NULL)
  ORDER BY
    published_at DESC
  LIMIT $4
)
SELECT
  get_content_current_tabcoins(content_window.id) as tabcoins
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
