import { TooManyRequestsError } from 'errors';
import database from 'infra/database.js';
import content from 'models/content.js';
import event from 'models/event.js';

const rules = {
  'create:user': createUserRule,
  'create:content:text_root': createContentTextRootRule,
  'create:content:text_child': createContentTextChildRule,
};

function canRequest(ruleId) {
  return async function (request, response, next) {
    try {
      await rules[ruleId](request.context);
      next();
    } catch (error) {
      // Pass if database's stored procedure is not yet deployed
      if (error.databaseErrorCode === database.errorCodes.UNDEFINED_FUNCTION) {
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
      message:
        'Identificamos a criação de muitos usuários em um curto período, então usuários criados recentemente podem ter sido desabilitados.',
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

async function createContentTextRootRule(context) {
  const results = await database.query({
    text: 'select firewall_create_content_text_root($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_content_text_root;

  if (!pass) {
    await createContentTextRootRuleSideEffect(context);

    throw new TooManyRequestsError({
      message:
        'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
    });
  }
}

async function createContentTextRootRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_root_side_effect($1)',
    values: [context.clientIp],
  });

  const contentsAffected = results.rows.map((row) => row.id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_root',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_root',
      contents: contentsAffected,
    },
  });

  await undoContentsTabcoins(results.rows, createdEvent);
}

async function createContentTextChildRule(context) {
  const results = await database.query({
    text: 'select firewall_create_content_text_child($1)',
    values: [context.clientIp],
  });

  const pass = results.rows[0].firewall_create_content_text_child;

  if (!pass) {
    await createContentTextChildRuleSideEffect(context);

    throw new TooManyRequestsError({
      message:
        'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
    });
  }
}

async function createContentTextChildRuleSideEffect(context) {
  const results = await database.query({
    text: 'select * from firewall_create_content_text_child_side_effect($1)',
    values: [context.clientIp],
  });

  const contentsAffected = results.rows.map((row) => row.id);

  const createdEvent = await event.create({
    type: 'firewall:block_contents:text_child',
    originatorUserId: context.user.id,
    originatorIp: context.clientIp,
    metadata: {
      from_rule: 'create:content:text_child',
      contents: contentsAffected,
    },
  });

  await undoContentsTabcoins(results.rows, createdEvent);
}

async function undoContentsTabcoins(contentRows, createdEvent) {
  for (const contentObject of contentRows) {
    await content.creditOrDebitTabCoins(
      {
        ...contentObject,
        status: 'published',
      },
      contentObject,
      {
        eventId: createdEvent.id,
      },
    );
  }
}

export default Object.freeze({
  canRequest,
});
