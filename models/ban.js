import database from 'infra/database.js';
import balance from 'models/balance.js';
import content from 'models/content.js';
import session from 'models/session.js';
import user from 'models/user.js';

async function nuke(userId, options = {}) {
  await user.removeFeatures(userId, null, options);
  await session.expireAllFromUserId(userId, options);
  await unpublishAllContent(userId, options);
  await undoAllBalanceOperations(userId, options);
  const nukedUser = await user.addFeatures(userId, ['nuked'], options);
  await injectBalanceIntoUserObject(nukedUser, options);
  return nukedUser;

  async function unpublishAllContent(userId, options = {}) {
    const userContents = await content.findAll(
      {
        where: {
          owner_id: userId,
        },
      },
      options
    );

    for (const userContent of userContents) {
      if (userContent.status !== 'deleted') {
        await content.update(
          userContent.id,
          {
            status: 'deleted',
          },
          {
            skipBalanceOperations: true,
            transaction: options.transaction,
          }
        );
      }
    }
  }

  async function undoAllBalanceOperations(userId, options = {}) {
    const userEvents = await getAllEventsFromUser(userId, options);

    for (const userEvent of userEvents) {
      const eventBalanceOperations = await getAllBalanceOperationsFromEvent(userEvent.id, options);

      for (const eventBalanceOperation of eventBalanceOperations) {
        await balance.undo(eventBalanceOperation.id, options);
      }
    }

    async function getAllEventsFromUser(userId, options = {}) {
      const query = {
        text: `
          SELECT
            *
          FROM
            events
          WHERE
            originator_user_id = $1
          ORDER BY
            created_at ASC
        ;`,
        values: [userId],
      };

      const results = await database.query(query, options);

      return results.rows;
    }

    async function getAllBalanceOperationsFromEvent(eventId, options = {}) {
      const query = {
        text: `
          SELECT
            *
          FROM
            balance_operations
          WHERE
            originator_id = $1
          ORDER BY
            created_at ASC
        ;`,
        values: [eventId],
      };

      const results = await database.query(query, options);

      return results.rows;
    }
  }
}

async function injectBalanceIntoUserObject(user, options = {}) {
  user.tabcoins = await balance.getTotal(
    {
      balanceType: 'user:tabcoin',
      recipientId: user.id,
    },
    options
  );

  user.tabcash = await balance.getTotal(
    {
      balanceType: 'user:tabcash',
      recipientId: user.id,
    },
    options
  );
}

export default Object.freeze({
  nuke,
});
