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
    ),
    active_sponsored_contents AS (
        SELECT
            contents.id,
            contents.owner_id,
            contents.published_at,
            get_sponsored_content_current_tabcoins(sponsored_contents.id) as tabcoins,
            0 as tabcoins_credit,
            0 as tabcoins_debit,
            get_sponsored_content_current_tabcash(sponsored_contents.id) as tabcash
        FROM contents
        INNER JOIN sponsored_contents ON sponsored_contents.content_id = contents.id
        WHERE
            status = 'sponsored'
            AND (
                sponsored_contents.deactivate_at IS NULL
                OR sponsored_contents.deactivate_at > NOW()
            )
    ),
    ranked_sponsored_contents AS (
        SELECT
            active_sponsored_contents.*,
            (3 * (
                tabcoins
                + POWER(tabcash, 0.6)/1.6
                - EXTRACT(epoch FROM AGE(NOW(), active_sponsored_contents.published_at)/3600)
            ) + (
                SELECT COUNT(DISTINCT all_contents.owner_id)
                FROM contents as all_contents
                WHERE all_contents.path @> ARRAY[active_sponsored_contents.id]
                    AND all_contents.owner_id != active_sponsored_contents.owner_id
                    AND all_contents.status = 'published'
            )) as score
        FROM active_sponsored_contents
    ),
    ranked_published_root_contents AS (
        SELECT
            *
        FROM (
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
            UNION ALL
            SELECT
                *
            FROM ranked_sponsored_contents
        ) AS all_ranked_contents
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
        ) as children_deep_count
        FROM ranked
        INNER JOIN
          contents ON contents.id = ranked.id
        INNER JOIN users ON ranked.owner_id = users.id
        ORDER BY
            rank_group,
            score DESC,
            published_at DESC;
`;

export default Object.freeze({
  rankedContent,
});
