import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import emailConfirmation from 'models/email-confirmation.js';
import pagination from 'models/pagination.js';
import validator from 'models/validator.js';

async function findAll(values = {}, options) {
  const where = values.where ?? {};

  const whereClause = buildWhereClause(where);
  const query = {
    text: `
      SELECT
        *
      FROM
        users
      CROSS JOIN LATERAL (
        SELECT
          get_user_current_tabcoins(users.id) as tabcoins,
          get_user_current_tabcash(users.id) as tabcash
      ) as balance
      ${whereClause.text}
      ORDER BY
        created_at ASC
      ;`,
    values: whereClause.values,
  };

  const results = await database.query(query, options);
  return results.rows;
}

function buildWhereClause(where, nextArgumentIndex = 1) {
  const values = [];
  const conditions = Object.entries(where).map(([column, value]) => {
    values.push(value);
    return Array.isArray(value) ? `${column} = ANY ($${nextArgumentIndex++})` : `${column} = $${nextArgumentIndex++}`;
  });

  return {
    text: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values: values,
    nextArgumentIndex: nextArgumentIndex,
  };
}

async function findAllWithPagination(values) {
  const offset = (values.page - 1) * values.per_page;

  const query = {
    text: `
      WITH user_window AS (
        SELECT
          COUNT(*) OVER()::INTEGER as total_rows,
          id
        FROM users
        ORDER BY updated_at DESC
        LIMIT $1 OFFSET $2
      )

      SELECT
        *
      FROM
        users
      INNER JOIN
        user_window ON users.id = user_window.id
      CROSS JOIN LATERAL (
        SELECT
          get_user_current_tabcoins(users.id) as tabcoins,
          get_user_current_tabcash(users.id) as tabcash
      ) as balance
      ORDER BY updated_at DESC
    `,
    values: [values.limit || values.per_page, offset],
  };

  const queryResults = await database.query(query);

  const results = {
    rows: queryResults.rows,
  };

  values.total_rows = results.rows[0]?.total_rows ?? (await countTotalRows());

  results.pagination = pagination.get(values);

  return results;
}

async function countTotalRows() {
  const countQuery = `SELECT COUNT(*) OVER()::INTEGER as total_rows FROM users`;
  const countResult = await database.query(countQuery);
  return countResult.rows[0].total_rows;
}

async function findOneByUsername(username, options = {}) {
  const baseQuery = `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
          AND NOT 'nuked' = ANY(features)
        LIMIT
          1
      )`;

  const balanceQuery = `
      SELECT
        user_found.*,
        get_user_current_tabcoins(user_found.id) as tabcoins,
        get_user_current_tabcash(user_found.id) as tabcash
      FROM
        user_found
      `;

  const queryText = options.withBalance ? `${baseQuery} ${balanceQuery};` : `${baseQuery} SELECT * FROM user_found;`;

  const query = {
    text: queryText,
    values: [username],
  };

  const results = await database.query(query, options);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O "username" informado não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND',
      key: 'username',
    });
  }

  return results.rows[0];
}

async function findOneByEmail(email, options = {}) {
  const baseQuery = `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
          AND NOT 'nuked' = ANY(features)
        LIMIT
          1
      )`;

  const balanceQuery = `
      SELECT
        user_found.*,
        get_user_current_tabcoins(user_found.id) as tabcoins,
        get_user_current_tabcash(user_found.id) as tabcash
      FROM
        user_found
      `;

  const queryText = options.withBalance ? `${baseQuery} ${balanceQuery};` : `${baseQuery} SELECT * FROM user_found;`;

  const query = {
    text: queryText,
    values: [email],
  };

  const results = await database.query(query, options);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O email informado não foi encontrado no sistema.`,
      action: 'Verifique se o "email" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:FIND_ONE_BY_EMAIL:NOT_FOUND',
      key: 'email',
    });
  }

  return results.rows[0];
}

async function findOneById(userId, options = {}) {
  const baseQuery = `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
      )`;

  const balanceQuery = `
      SELECT
        user_found.*,
        get_user_current_tabcoins(user_found.id) as tabcoins,
        get_user_current_tabcash(user_found.id) as tabcash
      FROM
        user_found
      `;

  const queryText = options.withBalance ? `${baseQuery} ${balanceQuery};` : `${baseQuery} SELECT * FROM user_found;`;

  const query = {
    text: queryText,
    values: [userId],
  };

  const results = await database.query(query, options);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O id "${userId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:FIND_ONE_BY_ID:NOT_FOUND',
      key: 'id',
    });
  }

  return results.rows[0];
}

async function create(postedUserData) {
  const validUserData = validatePostSchema(postedUserData);
  await validateUniqueUser(validUserData);
  await deleteExpiredUsers(validUserData);
  await hashPasswordInObject(validUserData);

  validUserData.features = ['read:activation_token'];

  const newUser = await runInsertQuery(validUserData);
  return newUser;

  async function runInsertQuery(validUserData) {
    const query = {
      text: `
        INSERT INTO
          users (username, email, password, features)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
        ;`,
      values: [validUserData.username, validUserData.email, validUserData.password, validUserData.features],
    };

    const results = await database.query(query);
    const newUser = results.rows[0];

    newUser.tabcoins = 0;
    newUser.tabcash = 0;

    return newUser;
  }
}

function createAnonymous() {
  return {
    features: ['read:activation_token', 'create:session', 'create:user'],
  };
}

function validatePostSchema(postedUserData) {
  const cleanValues = validator(postedUserData, {
    username: 'required',
    email: 'required',
    password: 'required',
  });

  return cleanValues;
}

async function update(targetUser, postedUserData, options = {}) {
  const validPostedUserData = validatePatchSchema(postedUserData);

  const isTargetUserComplete = 'username' in targetUser;
  const needsTargetUserComplete = 'username' in validPostedUserData || 'email' in validPostedUserData;
  const currentUser =
    !isTargetUserComplete && needsTargetUserComplete
      ? await findOneById(targetUser.id, { transaction: options.transaction })
      : targetUser;

  const shouldValidateUsername =
    'username' in validPostedUserData &&
    currentUser.username.toLowerCase() !== validPostedUserData.username.toLowerCase();
  const shouldValidateEmail =
    'email' in validPostedUserData && validPostedUserData.email.toLowerCase() !== currentUser.email.toLowerCase();

  if (shouldValidateUsername || shouldValidateEmail) {
    try {
      await validateUniqueUser({ ...validPostedUserData, id: currentUser.id }, { transaction: options.transaction });
      await deleteExpiredUsers(validPostedUserData, { transaction: options.transaction });
      if (shouldValidateEmail && !options.skipEmailConfirmation) {
        await emailConfirmation.createAndSendEmail(currentUser, validPostedUserData.email, {
          transaction: options.transaction,
        });
        delete validPostedUserData.email;
      }
    } catch (error) {
      if (error instanceof ValidationError && error.key === 'email' && !options.skipEmailConfirmation) {
        delete validPostedUserData.email;
      } else {
        throw error;
      }
    }
  }

  if ('password' in validPostedUserData) {
    await hashPasswordInObject(validPostedUserData);
  }
  const updatedUser = await runUpdateQuery(currentUser, validPostedUserData, {
    transaction: options.transaction,
  });
  return updatedUser;

  async function runUpdateQuery(currentUser, valuesToUpdate, options) {
    const values = [currentUser.id];
    const setFields = [];

    for (const [field, newValue] of Object.entries(valuesToUpdate)) {
      if (newValue !== undefined) {
        values.push(newValue);
        setFields.push(`${field} = $${values.length}`);
      }
    }

    if (!setFields.length) {
      return currentUser;
    }

    const query = {
      text: `
        UPDATE
          users
        SET
          ${setFields.join(', ')},
          updated_at = (now() at time zone 'utc')
        WHERE
          id = $1
        RETURNING
          *,
          get_user_current_tabcoins($1) as tabcoins,
          get_user_current_tabcash($1) as tabcash
      ;`,
      values: values,
    };

    const results = await database.query(query, options);
    const updatedUser = results.rows[0];

    return updatedUser;
  }
}

function validatePatchSchema(postedUserData) {
  const cleanValues = validator(postedUserData, {
    username: 'optional',
    email: 'optional',
    password: 'optional',
    description: 'optional',
    notifications: 'optional',
  });

  return cleanValues;
}

async function validateUniqueUser(userData, options) {
  const orConditions = [];
  const queryValues = [];

  if (userData.username) {
    queryValues.push(userData.username);
    orConditions.push(`LOWER(u.username) = LOWER($${queryValues.length})`);
  }

  if (userData.email) {
    queryValues.push(userData.email);
    orConditions.push(`LOWER(u.email) = LOWER($${queryValues.length})`);
  }

  let where = `(${orConditions.join(' OR ')})`;

  if (userData.id) {
    queryValues.push(userData.id);
    where += ` AND u.id <> $${queryValues.length}`;
  }

  const query = {
    text: `
      SELECT
        u.username,
        u.email
      FROM
        users u
      LEFT JOIN activate_account_tokens aat ON user_id = u.id
      WHERE
        (
          COALESCE(aat.used, true)
          OR aat.expires_at > NOW()
          OR 'nuked' = ANY(u.features)
        )
        AND ${where}
    `,
    values: queryValues,
  };

  const results = await database.query(query, options);

  if (!results.rowCount) return;

  const isSameUsername = results.rows.some(
    ({ username }) => username.toLowerCase() === userData.username?.toLowerCase(),
  );

  if (isSameUsername) {
    throw new ValidationError({
      message: `O "username" informado já está sendo usado.`,
      stack: new Error().stack,
      errorLocationCode: `MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS`,
      key: 'username',
    });
  }

  throw new ValidationError({
    message: `O email informado já está sendo usado.`,
    stack: new Error().stack,
    errorLocationCode: `MODEL:USER:VALIDATE_UNIQUE_EMAIL:ALREADY_EXISTS`,
    key: 'email',
  });
}

async function deleteExpiredUsers(userObject, options) {
  const query = {
    text: `
      DELETE FROM
        users u
      WHERE
        (
          LOWER(u.username) = LOWER($1)
          OR LOWER(u.email) = LOWER($2)
        )
        AND NOT ('nuked' = ANY(u.features))
        AND NOT EXISTS (
          SELECT 1
          FROM activate_account_tokens aat
          WHERE aat.user_id = u.id
            AND (
              COALESCE(aat.used, true)
              OR aat.expires_at > NOW()
            )
        )
    ;`,
    values: [userObject.username, userObject.email],
  };

  await database.query(query, options);
}

async function hashPasswordInObject(userObject) {
  userObject.password = await authentication.hashPassword(userObject.password);
  return userObject;
}

async function removeFeatures(userId, features, options = {}) {
  let lastUpdatedUser;

  if (features?.length > 0) {
    for (const feature of features) {
      const query = {
        text: `
          UPDATE
            users
          SET
            features = array_remove(features, $1),
            updated_at = (now() at time zone 'utc')
          WHERE
            id = $2
          RETURNING
            *
        ;`,
        values: [feature, userId],
      };

      const results = await database.query(query, options);
      lastUpdatedUser = results.rows[0];
    }
  } else {
    const query = {
      text: `
        UPDATE
          users
        SET
          features = '{}',
          updated_at = (now() at time zone 'utc')
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [userId],
    };

    const results = await database.query(query, options);
    lastUpdatedUser = results.rows[0];
  }

  return lastUpdatedUser;
}

async function addFeatures(userId, features, options = {}) {
  const where = { id: userId };
  const firstWhereArgumentIndex = 2;
  const whereClause = buildWhereClause(where, firstWhereArgumentIndex);

  const updateQuery = `
    UPDATE
      users
    SET
      ${options.ignoreUpdatedAt ? '' : "updated_at = (now() at time zone 'utc'),"}
      features = array_cat(features, $1)
    ${whereClause.text}
    RETURNING
      *`;

  const updateWithBalanceQuery = `
    WITH updated_user AS (
      ${updateQuery}
    )
    SELECT
      updated_user.*,
      get_user_current_tabcoins(updated_user.id) as tabcoins,
      get_user_current_tabcash(updated_user.id) as tabcash
    FROM
      updated_user;
    `;

  const query = {
    text: options.withBalance ? updateWithBalanceQuery : updateQuery,
    values: [features, userId],
  };

  const results = await database.query(query, options);

  return Array.isArray(userId) ? results.rows : results.rows[0];
}

async function updateRewardedAt(userId, options) {
  if (!userId) {
    throw new ValidationError({
      message: `É necessário informar o "id" do usuário.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:UPDATE_REWARDED_AT:USER_ID_REQUIRED',
      key: 'userId',
    });
  }

  const query = {
    text: `
      UPDATE
        users
      SET
        rewarded_at = (now() at time zone 'utc')
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [userId],
  };

  const results = await database.query(query, options);

  return results.rows[0];
}

export default Object.freeze({
  create,
  findAll,
  findAllWithPagination,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  update,
  removeFeatures,
  addFeatures,
  createAnonymous,
  updateRewardedAt,
});
