import db from 'infra/database';
import query from 'queries/prestigeQueries';

async function getByContentId(contentId, { transaction, database = db } = {}) {
  const result = await database.query(
    {
      text: query.byContentId,
      values: [contentId],
    },
    { transaction },
  );

  let initialTabcoins = 0;

  const totalTabcoins = result.rows.reduce((acc, row) => {
    if (row.type === 'create:content:text_root' || row.type === 'create:content:text_child') {
      initialTabcoins = row.amount;
    }
    return acc + row.amount;
  }, 0);

  return {
    initialTabcoins,
    totalTabcoins,
  };
}

async function getByUserId(
  userId,
  {
    timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    offset = 3,
    isRoot = false,
    limit = 20,
    transaction,
    database = db,
  } = {},
) {
  const result = await database.query(
    {
      text: query.byUserId,
      values: [userId, timeOffset, isRoot, limit, offset],
    },
    { transaction },
  );

  const mean = calcTabcoinsAverage(result.rows);

  return calcPrestigeLevel(mean, isRoot);
}

function calcTabcoinsAverage(tabcoinsObjectArray) {
  const length = tabcoinsObjectArray?.length;

  if (!length || typeof length !== 'number') {
    return 1; // TabCoins default balance
  }

  const tabcoins = tabcoinsObjectArray.reduce((acc, { tabcoins }) => acc + (tabcoins || 0), 0);

  return tabcoins / length;
}

function calcPrestigeLevel(mean, isRoot) {
  if (isRoot) {
    if (0.5 >= mean) return -1;
    if (1.1 >= mean) return 0;
    if (1.2 >= mean) return 1;
    if (1.3 >= mean) return 2;
    if (1.4 >= mean) return 3;
    if (1.6 >= mean) return 4;
    if (1.8 >= mean) return 5;
    if (2.1 >= mean) return 6;
    if (2.4 >= mean) return 7;
  } else {
    if (0.4 >= mean) return -1;
    if (1.0 >= mean) return 0;
    if (1.1 >= mean) return 1;
    if (1.2 >= mean) return 2;
    if (1.25 >= mean) return 3;
    if (1.3 >= mean) return 4;
    if (1.5 >= mean) return 5;
    if (1.7 >= mean) return 6;
    if (2.0 >= mean) return 7;
  }

  return Math.ceil(mean + 5);
}

export default Object.freeze({
  calcPrestigeLevel,
  calcTabcoinsAverage,
  getByContentId,
  getByUserId,
});
