const rankedContent = `
    WITH
    latest_published_root_contents AS (
        SELECT
            contents.id,
            contents.owner_id,
            contents.parent_id,
            contents.slug,
            contents.title,
            contents.status,
            contents.source_url,
            contents.created_at,
            contents.updated_at,
            contents.published_at,
            contents.deleted_at,
            get_current_balance('content:tabcoin', contents.id) as tabcoins
        FROM contents
        WHERE
            parent_id IS NULL
            AND status = 'published'
            AND published_at > NOW() - INTERVAL '1 week'
    ),
    ranked_published_root_contents AS (
        SELECT
            *,
            COUNT(*) OVER()::INTEGER as total_rows
        FROM latest_published_root_contents
        WHERE tabcoins > 0
        ORDER BY
            tabcoins DESC,
            published_at DESC
    ),
    group_1 AS (
        SELECT
            *,
            1 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '36 hours'
            AND tabcoins > 11
        ORDER BY
            published_at DESC
        LIMIT 10
    ),
    group_2 AS (
        SELECT * FROM group_1
        UNION ALL
        SELECT
            *,
            2 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '24 hours'
            AND tabcoins > 6
            AND id NOT IN (SELECT id FROM group_1)
        ORDER BY
            rank_group,
            published_at DESC
        LIMIT 20
    ),
    group_3 AS (
        (SELECT
            *,
            3 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '12 hours'
            AND id NOT IN (SELECT id FROM group_2)
        ORDER BY
            published_at DESC
        LIMIT 5)
        UNION ALL
        SELECT * FROM group_2
    ),
    group_4 AS (
        (SELECT
            *,
            4 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '3 days'
            AND tabcoins > 11
            AND id NOT IN (SELECT id FROM group_3)
        ORDER BY
            published_at DESC
        LIMIT 10)
        UNION ALL
        SELECT * FROM group_3
    ),
    group_5 AS (
        (SELECT
            *,
            5 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '72 hours'
            AND tabcoins > 2
            AND id NOT IN (SELECT id FROM group_4)
        ORDER BY
            published_at DESC
        LIMIT 10)
        UNION ALL
        SELECT * FROM group_4
    ),
    ranked AS (
        SELECT * FROM group_5
        UNION ALL
        SELECT
            *,
            6 as rank_group
        FROM ranked_published_root_contents
        WHERE id NOT IN (SELECT id FROM group_5)
        ORDER BY
            rank_group,
            tabcoins DESC,
            published_at DESC
        LIMIT $1
        OFFSET $2
    )
    SELECT
        ranked.id,
        ranked.owner_id,
        ranked.parent_id,
        ranked.slug,
        ranked.title,
        ranked.status,
        ranked.source_url,
        ranked.created_at,
        ranked.updated_at,
        ranked.published_at,
        ranked.deleted_at,
        ranked.tabcoins,
        ranked.rank_group,
        ranked.total_rows,
        users.username as owner_username,
        (WITH RECURSIVE children AS
            (SELECT id,
                 parent_id
            FROM contents as all_contents
            WHERE
                all_contents.id = ranked.id
                AND all_contents.status = 'published'
            UNION ALL
            SELECT
                all_contents.id,
                all_contents.parent_id
            FROM contents as all_contents
            INNER JOIN children ON all_contents.parent_id = children.id
            WHERE all_contents.status = 'published'
            )
            SELECT count(children.id)::integer
            FROM children
            WHERE children.id NOT IN (ranked.id)
        ) as children_deep_count
        FROM ranked
        INNER JOIN users ON ranked.owner_id = users.id
        ORDER BY
            rank_group,
            tabcoins DESC,
            published_at DESC;
`;

export default Object.freeze({
  rankedContent,
});
