import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import balance from 'models/balance.js';
import emailConfirmation from 'models/email-confirmation.js';
import pagination from 'models/pagination.js';
import validator from 'models/validator.js';

async function findAll() {
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
      ORDER BY
        created_at ASC
      ;`,
  };
  const results = await database.query(query);
  return results.rows;
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

// TODO: validate userId
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
  await validateUniqueUsername(validUserData.username);
  await validateUniqueEmail(validUserData.email);
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

// TODO: Refactor the interface of this function
// and the code inside to make it more future proof
// and to accept update using "userId".
async function update(username, postedUserData, options = {}) {
  const validPostedUserData = await validatePatchSchema(postedUserData);
  const currentUser = await findOneByUsername(username, { transaction: options.transaction });

  if (
    'username' in validPostedUserData &&
    currentUser.username.toLowerCase() !== validPostedUserData.username.toLowerCase()
  ) {
    await validateUniqueUsername(validPostedUserData.username, { transaction: options.transaction });
  }

  if ('email' in validPostedUserData) {
    await validateUniqueEmail(validPostedUserData.email, { transaction: options.transaction });

    if (!options.skipEmailConfirmation) {
      await emailConfirmation.createAndSendEmail(currentUser.id, validPostedUserData.email, {
        transaction: options.transaction,
      });
      delete validPostedUserData.email;
    }
  }

  if ('password' in validPostedUserData) {
    await hashPasswordInObject(validPostedUserData);
  }

  const userWithUpdatedValues = { ...currentUser, ...validPostedUserData };

  const updatedUser = await runUpdateQuery(currentUser, userWithUpdatedValues, {
    transaction: options.transaction,
  });
  return updatedUser;

  async function runUpdateQuery(currentUser, userWithUpdatedValues, options) {
    const query = {
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          description = $5,
          notifications = $6,
          updated_at = (now() at time zone 'utc')
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [
        currentUser.id,
        userWithUpdatedValues.username,
        userWithUpdatedValues.email,
        userWithUpdatedValues.password,
        userWithUpdatedValues.description,
        userWithUpdatedValues.notifications,
      ],
    };

    const results = await database.query(query, options);
    const updatedUser = results.rows[0];

    updatedUser.tabcoins = await balance.getTotal(
      {
        balanceType: 'user:tabcoin',
        recipientId: updatedUser.id,
      },
      options,
    );
    updatedUser.tabcash = await balance.getTotal(
      {
        balanceType: 'user:tabcash',
        recipientId: updatedUser.id,
      },
      options,
    );

    return updatedUser;
  }
}

async function validatePatchSchema(postedUserData) {
  const cleanValues = validator(postedUserData, {
    username: 'optional',
    email: 'optional',
    password: 'optional',
    description: 'optional',
    notifications: 'optional',
  });

  return cleanValues;
}

async function validateUniqueUsername(username, options) {
  const query = {
    text: 'SELECT username FROM users WHERE LOWER(username) = LOWER($1)',
    values: [username],
  };

  const results = await database.query(query, options);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O "username" informado já está sendo usado.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS',
      key: 'username',
    });
  }
}

async function validateUniqueEmail(email, options) {
  const query = {
    text: 'SELECT email FROM users WHERE LOWER(email) = LOWER($1)',
    values: [email],
  };

  const results = await database.query(query, options);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O email informado já está sendo usado.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:USER:VALIDATE_UNIQUE_EMAIL:ALREADY_EXISTS',
      key: 'email',
    });
  }
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

async function addFeatures(userId, features, options) {
  const query = {
    text: `
      UPDATE
        users
      SET
        features = array_cat(features, $1),
        updated_at = (now() at time zone 'utc')
      WHERE
        id = $2
      RETURNING
        *
    ;`,
    values: [features, userId],
  };

  const results = await database.query(query, options);

  return results.rows[0];
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
