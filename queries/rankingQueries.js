const rankedContent = `
    WITH
    latest_published_child_contents AS (
        SELECT
            contents.owner_id,
            contents.path
        FROM contents
        WHERE
            parent_id IS NOT NULL
            AND status = 'published'
            AND published_at > NOW() - INTERVAL '1 day'
    ),
    latest_interacted_root_contents AS (
        SELECT
            contents.id,
            contents.owner_id,
            contents.published_at,
            tabcoins_count.total_balance as tabcoins,
            tabcoins_count.total_credit as tabcoins_credit,
            tabcoins_count.total_debit as tabcoins_debit
        FROM contents
        LEFT JOIN get_content_balance_credit_debit(contents.id) tabcoins_count ON true
        WHERE
            parent_id IS NULL
            AND status = 'published'
            AND published_at > NOW() - INTERVAL '7 days'
            AND type != 'ad'
        UNION
        SELECT
            contents.id,
            contents.owner_id,
            contents.published_at,
            tabcoins_count.total_balance as tabcoins,
            tabcoins_count.total_credit as tabcoins_credit,
            tabcoins_count.total_debit as tabcoins_debit
        FROM contents
        INNER JOIN latest_published_child_contents
            ON latest_published_child_contents.path[1] = contents.id
            AND latest_published_child_contents.owner_id != contents.owner_id
        LEFT JOIN get_content_balance_credit_debit(contents.id) tabcoins_count ON true
        WHERE
            parent_id IS NULL
            AND status = 'published'
            AND type != 'ad'
    ),
    ranked_published_root_contents AS (
        SELECT
            latest.*,
            (3 * tabcoins + (
                SELECT COUNT(DISTINCT all_contents.owner_id)
                FROM contents as all_contents
                WHERE all_contents.path @> ARRAY[latest.id]
                    AND all_contents.owner_id != latest.owner_id
                    AND all_contents.status = 'published'
            )) as score,
            COUNT(*) OVER()::INTEGER as total_rows
        FROM latest_interacted_root_contents AS latest
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
            AND score > 16
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
            AND score > 8
            AND id NOT IN (SELECT id FROM group_1)
        ORDER BY
            rank_group,
            published_at DESC
        LIMIT 20
    ),
    group_3 AS (
        WITH new_contents_by_owner AS (
            SELECT DISTINCT ON (owner_id) *
            FROM ranked_published_root_contents
            WHERE
                published_at > NOW() - INTERVAL '12 hours'
                AND id NOT IN (SELECT id FROM group_2)
            ORDER BY
                owner_id,
                published_at DESC
        )(
            SELECT
                *,
                3 as rank_group
            FROM new_contents_by_owner
            ORDER BY published_at DESC
            LIMIT 4
        )
        UNION ALL
        SELECT * FROM group_2
    ),
    group_4 AS (
        (SELECT
            *,
            4 as rank_group
        FROM ranked_published_root_contents
        WHERE
            published_at > NOW() - INTERVAL '36 hours'
            AND score > 11
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
            published_at > NOW() - INTERVAL '3 days'
            AND score > 8
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
            score DESC,
            published_at DESC
        LIMIT $1
        OFFSET $2
    )
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
        ranked.tabcoins,
        ranked.tabcoins_credit,
        ranked.tabcoins_debit,
        ranked.total_rows,
        users.username as owner_username,
        (
            SELECT COUNT(*)
            FROM contents as all_contents
            WHERE all_contents.path @> ARRAY[ranked.id]
                AND all_contents.status = 'published'
        ) as children_deep_count,
        (
            SELECT child_contents.body
            FROM contents as child_contents
            LEFT JOIN LATERAL get_content_balance_credit_debit(child_contents.id) child_tabcoins ON true
            WHERE
                child_contents.parent_id = ranked.id
                AND child_contents.status = 'published'
            ORDER BY
                child_tabcoins.total_balance DESC,
                child_contents.published_at DESC
            LIMIT 1
        ) as top_comment_body
        FROM ranked
        INNER JOIN
          contents ON contents.id = ranked.id
        INNER JOIN users ON ranked.owner_id = users.id
        ORDER BY
            rank_group,
            score DESC,
            published_at DESC;
`;

const recentContent = `
WITH root_contents AS (
    SELECT
        c.id,
        c.owner_id,
        c.slug,
        c.title,
        c.status,
        c.source_url,
        c.created_at,
        c.updated_at,
        c.published_at,
        LENGTH(c.body) AS post_length
    FROM contents c
    WHERE
        c.parent_id IS NULL
        AND c.status = 'published'
        AND c.type != 'ad'
        AND c.published_at > NOW() - $3::interval
),

tabcoin_stats AS (
    SELECT
        rc.id,
        balance.total_balance AS tabcoins,
        balance.total_credit AS upvotes,
        balance.total_debit AS downvotes
    FROM root_contents rc
    LEFT JOIN LATERAL get_content_balance_credit_debit(rc.id) balance ON true
),

/*
  Uma única varredura da subárvore de comentários produz todas as métricas de
  discussão. Usa COUNT(child.id) (e não COUNT(*)) para que posts sem comentários
  fiquem com 0 no LEFT JOIN, em vez de serem inflados para 1.
*/
comment_stats AS (
    SELECT
        root.id AS root_id,

        COUNT(child.id) AS comment_count,

        COUNT(DISTINCT child.owner_id) AS unique_commenters,

        COALESCE(AVG(LENGTH(child.body)), 0) AS avg_comment_length,

        COALESCE(AVG(array_length(child.path, 1)), 0) AS avg_comment_children,

        COUNT(child.id) FILTER (
            WHERE child.published_at > NOW() - INTERVAL '24 hours'
        ) AS recent_comments,

        COUNT(child.id) AS children_deep_count

    FROM root_contents root
    LEFT JOIN contents child
        ON child.path[1] = root.id
        AND child.parent_id IS NOT NULL
        AND child.status = 'published'
    GROUP BY root.id
),

top_comment AS (
    SELECT DISTINCT ON (c.parent_id)
        c.parent_id AS root_id,
        c.body
    FROM contents c
    LEFT JOIN LATERAL get_content_balance_credit_debit(c.id) balance ON true
    WHERE
        c.parent_id IN (SELECT id FROM root_contents)
        AND c.status = 'published'
    ORDER BY
        c.parent_id,
        balance.total_balance DESC,
        c.published_at DESC
)

SELECT
    rc.id,
    rc.owner_id,
    rc.slug,
    rc.title,
    rc.status,
    rc.source_url,
    rc.created_at,
    rc.updated_at,
    rc.published_at,

    COUNT(*) OVER()::INTEGER AS total_rows,

    rc.post_length,

    ts.tabcoins,
    ts.upvotes,
    -- Downvotes ficam gravados como débitos negativos (amount = -1 por voto),
    -- então a magnitude positiva é -total_debit. O GREATEST mantém o piso em 0.
    GREATEST(-ts.downvotes, 0) AS downvotes,

    cs.comment_count,
    cs.unique_commenters,
    cs.avg_comment_length,
    cs.avg_comment_children,

    0 AS recent_votes,
    cs.recent_comments,

    cs.children_deep_count,

    tc.body AS top_comment_body,

    users.username AS owner_username

FROM root_contents rc

LEFT JOIN tabcoin_stats ts ON ts.id = rc.id
LEFT JOIN comment_stats cs ON cs.root_id = rc.id
LEFT JOIN top_comment tc ON tc.root_id = rc.id

INNER JOIN users ON users.id = rc.owner_id

ORDER BY rc.published_at DESC
LIMIT $1
OFFSET $2;
`;

export default Object.freeze({
  rankedContent,
  recentContent,
});
