import database from 'infra/database.js';
import balance from 'models/balance.js';
import session from 'models/session.js';
import user from 'models/user.js';

async function nuke(userId, options = {}) {
  await user.removeFeatures(userId, null, options);
  await session.expireAllFromUserId(userId, options);
  await unpublishAllContent(userId, options);
  await undoAllRatingOperations(userId, options);
  const nukedUser = await user.addFeatures(userId, ['nuked'], options);
  return nukedUser;

  async function unpublishAllContent(userId, options = {}) {
    const query = {
      text: `
        UPDATE
          contents
        SET
          status = 'deleted',
          deleted_at = (NOW() AT TIME ZONE 'utc')
        WHERE
          owner_id = $1
          AND status != 'deleted'
      ;`,
      values: [userId],
    };

    await database.query(query, options);
  }

  async function undoAllRatingOperations(userId, options = {}) {
    const userEvents = await getAllRatingEventsFromUser(userId, options);

    for (const userEvent of userEvents) {
      const eventBalanceOperations = await balance.findAllByOriginatorId(userEvent.id, options);

      for (const eventBalanceOperation of eventBalanceOperations) {
        await balance.undo(eventBalanceOperation, options);
      }
    }

    async function getAllRatingEventsFromUser(userId, options = {}) {
      const query = {
        text: `
          SELECT
            *
          FROM
            events
          WHERE
            originator_user_id = $1
            AND created_at > NOW() - INTERVAL '2 weeks'
            AND type = 'update:content:tabcoins'
          ORDER BY
            created_at ASC
        ;`,
        values: [userId],
      };

      const results = await database.query(query, options);

      return results.rows;
    }
  }
}

export default Object.freeze({
  nuke,
});
