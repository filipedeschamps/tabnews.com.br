export const queryRankedContent = `
    WITH all_contents AS (
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
    ),
    ranked AS ((((((
        SELECT
            *,
            0 as rank_group
        FROM all_contents 
        WHERE
            published_at > NOW() - INTERVAL '1 week'
            --Descomentar quando score for computado
            --AND score > 0.9  -- Serão poucos conteúdos com score maior que 0.9, então por isso deixei o tempo de uma semana
            AND tabcoins > 10 -- Excluir essa linha ao computar o score
        ORDER BY
            --score DESC, --Descomentar quando score for computado
            tabcoins DESC, --Excluir essa linha ao computar o score
            published_at DESC
        LIMIT 1
    )
    UNION
        SELECT
            *,
            1 as rank_group
        FROM all_contents
        WHERE
            published_at > NOW() - INTERVAL '2 days'
            --AND score > 0.8 -- Descomentar quando score for computado
            AND tabcoins > 5 -- Excluir essa linha ao computar o score
        ORDER BY
            rank_group,
            --score DESC, --Descomentar quando score for computado
            tabcoins DESC, --Excluir essa linha ao computar o score
            published_at DESC
        LIMIT 3
    )
    UNION
        SELECT
            *,
            2 as rank_group
        FROM all_contents
        WHERE
            published_at > NOW() - INTERVAL '6 hours'
            --AND score > 0.6 -- Descomentar quando score for computado
            AND tabcoins > 1 -- Excluir essa linha ao computar o score
        ORDER BY
            rank_group,
            --score DESC, --Descomentar quando score for computado
            tabcoins DESC, --Excluir essa linha ao computar o score
            published_at DESC
        LIMIT 15
    )
    UNION
        SELECT
            *,
            3 as rank_group
        FROM all_contents
        WHERE
            published_at > NOW() - INTERVAL '1 day'
            --AND score > 0.6 -- Descomentar quando score for computado
            AND tabcoins > 1 -- Excluir essa linha ao computar o score
        ORDER BY
            rank_group,
            --score DESC, --Descomentar quando score for computado
            tabcoins DESC, --Excluir essa linha ao computar o score
            published_at DESC
        LIMIT 30
    )
    UNION
        SELECT
            *,
            4 as rank_group
        FROM all_contents
        WHERE
            published_at > NOW() - INTERVAL '3 days'
            --AND score > 0.6 -- Descomentar quando score for computado
            AND tabcoins > 1 -- Excluir essa linha ao computar o score
        ORDER BY
            rank_group,
            --score DESC, --Descomentar quando score for computado
            tabcoins DESC, --Excluir essa linha ao computar o score
            published_at DESC
        LIMIT 60
    )
    UNION
        SELECT
            *,
            5 as rank_group
        FROM all_contents
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
        users.username as owner_username,
        MIN(rank_group) as rank_group,
        (
            WITH RECURSIVE children AS(
                SELECT
                    id,
                    parent_id
                FROM
                    contents as all_contents
                WHERE
                    all_contents.id = ranked.id AND
                    all_contents.status = 'published'
                UNION ALL
                SELECT
                    all_contents.id,
                    all_contents.parent_id
                FROM
                    contents as all_contents
                INNER JOIN
                    children ON all_contents.parent_id = children.id
                WHERE
                    all_contents.status = 'published'
            )
            SELECT
                count(children.id):: integer
            FROM
                children
            WHERE
                children.id NOT IN(ranked.id)
        ) as children_deep_count
    FROM ranked
    INNER JOIN
        users ON ranked.owner_id = users.id
    GROUP BY
        ranked.id,
        ranked.slug,
        ranked.owner_id,
        ranked.parent_id,
        ranked.title,
        ranked.status,
        ranked.source_url,
        ranked.created_at,
        ranked.updated_at,
        ranked.published_at,
        ranked.deleted_at,
        ranked.tabcoins,
        owner_username
    ORDER BY
        rank_group,
        -- ranked.score DESC, --Descomentar quando score for computado
        tabcoins DESC, --Excluir essa linha ao computar o score
        published_at DESC
    LIMIT $1 OFFSET $2;
`;

export default Object.freeze({
  queryRankedContent,
});
