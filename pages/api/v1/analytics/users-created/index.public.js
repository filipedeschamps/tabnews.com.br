import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import database from 'infra/database.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getHandler);

async function getHandler(request, response) {
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

  const usersCreated = results.rows.map((row) => {
    return {
      date: row.date,
      cadastros: row.cadastros || 0,
    };
  });

  response.setHeader('Cache-Control', 'public, 300, stale-while-revalidate');
  return response.status(200).json(usersCreated);
}
