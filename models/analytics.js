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

async function getVotesGraph({ limit = 300, showUsernames = false } = {}) {
  const results = await database.query({
    text: `
      SELECT
        id,
        originator_user_id as from,
        metadata->>'content_owner_id' as to,
        metadata->>'transaction_type' as transaction_type,
        originator_ip as ip,
        created_at
      FROM events
      WHERE
        type = 'update:content:tabcoins'
      ORDER BY created_at DESC
      LIMIT $1;
    `,
    values: [limit],
  });

  const usersMap = new Map();
  const ipNodesMap = new Map();
  const votesMap = new Map();

  results.rows.forEach((row) => {
    const from = usersMap.get(row.from)?.id || hash(row.from, row.id);
    const to = usersMap.get(row.to)?.id || hash(row.to, row.id);

    usersMap.set(row.from, {
      id: from,
      group: 'users',
      votes: (usersMap.get(row.from)?.votes || 0) + 1,
    });

    usersMap.set(row.to, {
      id: to,
      group: 'users',
      votes: (usersMap.get(row.to)?.votes || 0) + 1,
    });

    if (ipNodesMap.has(row.ip)) {
      ipNodesMap.get(row.ip).add(row.from);
    } else {
      ipNodesMap.set(row.ip, new Set([row.from]));
    }

    const fromToKey = `${row.transaction_type}-${from}-${to}`;
    votesMap.set(fromToKey, {
      from,
      to,
      type: row.transaction_type,
      value: (votesMap.get(fromToKey)?.value || 0) + 1,
    });
  });

  let ipId = 0;
  const sharedIps = [];
  const ipEdges = [];

  Array.from(ipNodesMap.values()).forEach((users) => {
    if (users.size === 1) return;

    ipId += 1;

    users.forEach((user) => {
      const from = usersMap.get(user).id;

      usersMap.set(user, {
        id: from,
        group: 'users',
        shared: true,
        votes: usersMap.get(user).votes,
      });

      ipEdges.push({ from, to: ipId, type: 'network' });
    });

    sharedIps.push({ id: ipId, group: 'IPs' });
  });

  const usersData = await database.query({
    text: `
    SELECT${showUsernames ? ` username,` : ''}
      'nuked' = ANY(features) as nuked,
      id as key
    FROM users
    WHERE
      id = ANY($1)
      ${showUsernames ? '' : `AND 'nuked' = ANY(features)`}
    ;`,
    values: [[...usersMap.keys()]],
  });

  usersData.rows.forEach((row) => {
    const user = usersMap.get(row.key);

    usersMap.set(row.key, {
      id: user.id,
      group: row.nuked ? 'nuked' : 'users',
      username: showUsernames && (user.votes > 2 || user.shared) ? row.username : null,
      votes: user.votes,
    });
  });

  return {
    nodes: [...usersMap.values(), ...sharedIps],
    edges: [...votesMap.values(), ...ipEdges],
  };
}

async function getVotesTaken() {
  const results = await database.query(`
  WITH range_values AS (
    SELECT date_trunc('day', NOW() - INTERVAL '2 MONTHS') as minval,
           date_trunc('day', max(created_at)) as maxval
    FROM events),

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

function hash(key, salt) {
  if (!salt) throw new Error('Necessário "salt" para gerar "hash"');

  const hash = crypto.createHash('md5');
  hash.update(key + salt);

  return hash.digest('base64').slice(0, 7);
}
