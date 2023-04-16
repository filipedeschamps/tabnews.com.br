import database from 'infra/database.js';

async function getChildContentsPublished() {
  const results = await database.query(`
  WITH range_values AS (
    SELECT date_trunc('day', NOW() - INTERVAL '2 MONTHS') as minval,
           date_trunc('day', max(published_at)) as maxval
    FROM contents),

  day_range AS (
    SELECT generate_series(minval, maxval, '1 day'::interval) as date
    FROM range_values
  ),

  daily_counts AS (
    SELECT date_trunc('day', created_at) as date,
           count(*) as ct
    FROM contents WHERE parent_id is not null
    GROUP BY 1
  )

  SELECT TO_CHAR(day_range.date :: DATE, 'dd/mm') as date,
         daily_counts.ct::INTEGER as respostas
  FROM day_range
  LEFT OUTER JOIN daily_counts on day_range.date = daily_counts.date;
  `);

  return results.rows.map((row) => {
    return {
      date: row.date,
      respostas: row.respostas || 0,
    };
  });
}

async function getRootContentsPublished() {
  const results = await database.query(`
  WITH range_values AS (
    SELECT date_trunc('day', NOW() - INTERVAL '2 MONTHS') as minval,
           date_trunc('day', max(published_at)) as maxval
    FROM contents),

  day_range AS (
    SELECT generate_series(minval, maxval, '1 day'::interval) as date
    FROM range_values
  ),

  daily_counts AS (
    SELECT date_trunc('day', created_at) as date,
           count(*) as ct
    FROM contents WHERE parent_id is null
    GROUP BY 1
  )

  SELECT TO_CHAR(day_range.date :: DATE, 'dd/mm') as date,
         daily_counts.ct::INTEGER as conteudos
  FROM day_range
  LEFT OUTER JOIN daily_counts on day_range.date = daily_counts.date;
  `);

  return results.rows.map((row) => {
    return {
      date: row.date,
      conteudos: row.conteudos || 0,
    };
  });
}

async function getUsersCreated() {
  const results = await database.query(`
  WITH range_values AS (
    SELECT date_trunc('day', NOW() - INTERVAL '2 MONTHS') as minval,
           date_trunc('day', max(created_at)) as maxval
    FROM users),

  day_range AS (
    SELECT generate_series(minval, maxval, '1 day'::interval) as date
    FROM range_values
  ),

  daily_counts AS (
    SELECT date_trunc('day', created_at) as date,
           count(*) as ct
    FROM users
    GROUP BY 1
  )

  SELECT TO_CHAR(day_range.date :: DATE, 'dd/mm') as date,
         daily_counts.ct::INTEGER as cadastros
  FROM day_range
  LEFT OUTER JOIN daily_counts on day_range.date = daily_counts.date;
  `);

  return results.rows.map((row) => {
    return {
      date: row.date,
      cadastros: row.cadastros || 0,
    };
  });
}

export default Object.freeze({
  getChildContentsPublished,
  getRootContentsPublished,
  getUsersCreated,
});
