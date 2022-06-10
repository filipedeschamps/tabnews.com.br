import database from 'infra/database.js';
import event from 'models/event.js';
import { TooManyRequestsError } from 'errors/index.js';

const rules = {
  'create:user': createUserRule,
};

function canRequest(ruleId) {
  return async function (request, response, next) {
    try {
      await rules[ruleId](request.context);
      next();
    } catch (error) {
      const undefinedFunctionErrorCode = '42883';

      // Pass if database's stored procedure is not yet deployed
      if (error.databaseErrorCode === undefinedFunctionErrorCode) {
        return next();
      }

      throw error;
    }
  };
}

async function createUserRule(context) {
  const results = await database.query({
    text: 'select firewall_create_user($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_user;

  if (!pass) {
    await createUserRuleSideEffect(context);

    throw new TooManyRequestsError({
      message: 'Você está tentando criar muitos usuários.',
      action: 'Contate o suporte caso acredite que isso seja um erro.',
    });
  }
}

async function createUserRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_user_side_effect($1)',
    values: [context.clientIp],
  });

  const usersAffected = results.rows.map((row) => row.user_id);

  await event.create({
    type: 'firewall:block_users',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:user',
      users: usersAffected,
    },
  });
}

export default Object.freeze({
  canRequest,
});
