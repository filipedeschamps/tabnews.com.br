import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content.js';
import event from 'models/event';
import prestige from 'models/prestige';
import user from 'models/user';

const tabcoinsBase = 20;
const contentAgeBase = 604_800_000; // one week in milliseconds

export default async function reward(request, dbOptions = {}) {
  if (request?.context?.user?.tabcoins === undefined) return 0;

  const { id: userId, username, tabcoins, rewarded_at: rewardedAt } = request.context.user;

  if (!userId || !username || !rewardedAt) return 0;

  const utcZeroHourToday = new Date().setUTCHours(0, 0, 0, 0);

  if (rewardedAt >= utcZeroHourToday) return 0;

  const prestigeFactor = await prestige.getByUserId(userId, dbOptions);
  const tabcoinsFactor = calcTabcoinsFactor(tabcoins);

  let reward = 0;

  if (tabcoinsFactor <= prestigeFactor) {
    const contentAgeFactor = await getContentAgeFactor(userId);
    reward = calcReward(prestigeFactor, tabcoinsFactor, contentAgeFactor);
  }

  reward = await saveReward(request, reward, dbOptions);

  return reward;
}

function calcTabcoinsFactor(tabcoins) {
  if (tabcoins <= 0) return 0;

  const tabcoinsFactor = Math.floor((tabcoins / tabcoinsBase) ** 2);

  return tabcoinsFactor;
}

async function getContentAgeFactor(owner_id) {
  const contents = await content.findWithStrategy({
    strategy: 'new',
    where: {
      owner_id,
      status: 'published',
    },
    per_page: 1,
  });

  const lastContent = contents?.rows?.[0];

  if (!lastContent) return 0;

  const lastContentAge = new Date() - new Date(lastContent.created_at);

  return Math.ceil(lastContentAge / contentAgeBase);
}

function calcReward(prestige, tabcoinsFactor, contentAgeFactor) {
  if (!contentAgeFactor || prestige <= tabcoinsFactor) return 0;

  const reward = Math.ceil((prestige - tabcoinsFactor) / contentAgeFactor);

  return reward;
}

async function saveReward(request, reward, { transaction }) {
  transaction = transaction || (await database.transaction());

  try {
    await transaction.query('BEGIN');
    await transaction.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

    if (reward > 0) {
      const currentUser = await user.findOneById(request.context.user.id, { transaction });

      const utcZeroHourToday = new Date().setUTCHours(0, 0, 0, 0);

      if (currentUser.rewarded_at >= utcZeroHourToday) {
        throw new Error('User already rewarded today');
      }

      const currentEvent = await event.create(
        {
          type: 'reward:user:tabcoins',
          originatorUserId: request.context.user.id,
          originatorIp: request.context.clientIp,
          metadata: {
            reward_type: 'daily',
            amount: reward,
          },
        },
        { transaction }
      );

      await balance.create(
        {
          balanceType: 'user:tabcoin',
          recipientId: request.context.user.id,
          amount: reward,
          originatorType: 'event',
          originatorId: currentEvent.id,
        },
        { transaction }
      );
    }

    await user.updateRewardedAt(request.context.user.id, { transaction });

    await transaction.query('COMMIT');

    return reward;
  } catch (error) {
    await transaction.query('ROLLBACK');

    if (
      error.databaseErrorCode === database.errorCodes.SERIALIZATION_FAILURE ||
      error.stack?.startsWith('error: could not serialize access due to concurrent update') ||
      error.message === 'User already rewarded today'
    ) {
      return 0;
    } else {
      throw error;
    }
  } finally {
    await transaction.release();
  }
}
