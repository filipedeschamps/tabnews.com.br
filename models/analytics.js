import crypto from 'node:crypto';

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

async function getVotesGraph({ limit = 300 } = {}) {
  const results = await database.query({
    text: `
      SELECT
        events.originator_user_id as from,
        events.metadata->>'content_owner_id' as to,
        events.metadata->>'transaction_type' as transaction_type,
        events.originator_ip as ip,
        events.created_at
      FROM events
      WHERE
        events.type = 'update:content:tabcoins'
      ORDER BY events.created_at DESC
      LIMIT $1;
    `,
    values: [limit],
  });

  const usersMap = new Map();
  const ipNodesMap = new Map();
  const votesMap = new Map();
  const ipEdgesMap = new Map();

  results.rows.forEach((row) => {
    const from = hashWithCache(row.from);
    const to = hashWithCache(row.to);
    const ip = hashWithCache(row.ip);

    usersMap.set(from, { id: from, group: 'users' });
    usersMap.set(to, { id: to, group: 'users' });

    if (ipNodesMap.has(ip)) {
      ipNodesMap.get(ip).add(from);
    } else {
      ipNodesMap.set(ip, new Set([from]));
    }

    const fromToKey = `${row.transaction_type}-${from}-${to}`;
    votesMap.set(fromToKey, {
      from,
      to,
      arrows: 'to',
      color: row.transaction_type === 'credit' ? 'green' : 'red',
      value: votesMap.has(fromToKey) ? votesMap.get(fromToKey).value + 1 : 1,
    });

    ipEdgesMap.set(`${from}-${ip}`, { from, to: ip, color: 'cyan' });
  });

  const sharedIps = [...ipNodesMap]
    .map((ip) => ({ id: ip[0], group: ip[1].size > 1 ? 'IPs' : undefined }))
    .filter((ip) => ip.group);

  const ipEdges = [...ipEdgesMap.values()].filter((edge) => sharedIps.some((ip) => ip.id === edge.to));

  return {
    nodes: [...usersMap.values(), ...sharedIps],
    edges: [...votesMap.values(), ...ipEdges],
  };
}

async function getVotesTaken() {
  const results = await database.query(`
  WITH range_values AS (
    SELECT date_trunc('day', NOW() - INTERVAL '2 MONTHS') as minval,
           date_trunc('day', NOW()) as maxval
  ),

  day_range AS (
    SELECT generate_series(minval, maxval, '1 day'::interval) as date
    FROM range_values
  ),

  daily_counts AS (
    SELECT date_trunc('day', created_at) as date,
           count(*) as ct
    FROM events
    WHERE type = 'update:content:tabcoins'
    GROUP BY 1
  )

  SELECT TO_CHAR(day_range.date :: DATE, 'dd/mm') as date,
         daily_counts.ct::INTEGER as votos
  FROM day_range
  LEFT OUTER JOIN daily_counts on day_range.date = daily_counts.date;
  `);

  return results.rows.map((row) => {
    return {
      date: row.date,
      votos: row.votos || 0,
    };
  });
}

export default Object.freeze({
  getChildContentsPublished,
  getRootContentsPublished,
  getUsersCreated,
  getVotesGraph,
  getVotesTaken,
});

const hashCache = {};

function hashWithCache(input) {
  if (hashCache[input]) return hashCache[input];

  const hash = crypto.createHash('md5');
  const salt = crypto.randomBytes(16).toString('base64');
  hash.update(salt + input);
  const token = hash.digest('base64').slice(0, 7);
  hashCache[input] = token;
  return token;
}
