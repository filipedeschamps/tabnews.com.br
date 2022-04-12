import Joi from 'joi';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import validator from 'models/validator.js';
import { ValidationError, NotFoundError } from 'errors/index.js';

async function findAll() {
  const query = {
    text: 'SELECT * FROM users ORDER BY created_at ASC;',
  };
  const results = await database.query(query);
  return results.rows;
}

//TODO: validate and filter single inputs like
// this one.
async function findOneByUsername(username) {
  const query = {
    text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;',
    values: [username],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O "username" informado não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND',
      key: 'username',
    });
  }

  return results.rows[0];
}

// TODO: validate email
async function findOneByEmail(email) {
  const query = {
    text: 'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
    values: [email],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O email informado não foi encontrado no sistema.`,
      action: 'Verifique se o "email" está digitado corretamente.',
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:FIND_ONE_BY_EMAIL:NOT_FOUND',
      key: 'email',
    });
  }

  return results.rows[0];
}

// TODO: validate userId
async function findOneById(userId) {
  const query = {
    text: 'SELECT * FROM users WHERE id = $1 LIMIT 1;',
    values: [userId],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O id "${userId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:FIND_ONE_BY_ID:NOT_FOUND',
      key: 'id',
    });
  }

  return results.rows[0];
}

async function create(postedUserData) {
  const validUserData = await validatePostSchema(postedUserData);
  await validateUniqueUsername(validUserData.username);
  await validateUniqueEmail(validUserData.email);
  await hashPasswordInObject(validUserData);

  validUserData.features = ['read:activation_token'];

  const newUser = await runInsertQuery(validUserData);
  return newUser;

  async function runInsertQuery(validUserData) {
    const query = {
      text: 'INSERT INTO users (username, email, password, features) VALUES($1, $2, $3, $4) RETURNING *;',
      values: [validUserData.username, validUserData.email, validUserData.password, validUserData.features],
    };
    const results = await database.query(query);
    return results.rows[0];
  }
}

function createAnonymous() {
  return {
    features: ['read:activation_token', 'create:session', 'create:user'],
  };
}

async function validatePostSchema(postedUserData) {
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
async function update(username, postedUserData) {
  const validPostedUserData = await validatePatchSchema(postedUserData);
  const currentUser = await findOneByUsername(username);

  if ('username' in validPostedUserData) {
    await validateUniqueUsername(validPostedUserData.username);
  }

  if ('email' in validPostedUserData) {
    await validateUniqueEmail(validPostedUserData.email);
  }

  if ('password' in validPostedUserData) {
    await hashPasswordInObject(validPostedUserData);
  }

  const userWithUpdatedValues = { ...currentUser, ...validPostedUserData };

  const updatedUser = await runUpdateQuery(currentUser, userWithUpdatedValues);
  return updatedUser;

  async function runUpdateQuery(currentUser, userWithUpdatedValues) {
    const query = {
      text: `UPDATE users SET
                  username = $1,
                  email = $2,
                  password = $3,
                  updated_at = (now() at time zone 'utc')
                  WHERE
                    id = $4
                  RETURNING *;`,
      values: [
        userWithUpdatedValues.username,
        userWithUpdatedValues.email,
        userWithUpdatedValues.password,
        currentUser.id,
      ],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

async function validatePatchSchema(postedUserData) {
  const cleanValues = validator(postedUserData, {
    username: 'optional',
    email: 'optional',
    password: 'optional',
  });

  return cleanValues;
}

async function validateUniqueUsername(username) {
  const query = {
    text: 'SELECT username FROM users WHERE LOWER(username) = LOWER($1)',
    values: [username],
  };

  const results = await database.query(query);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O "username" informado já está sendo usado.`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS',
      key: 'username',
    });
  }
}

async function validateUniqueEmail(email) {
  const query = {
    text: 'SELECT email FROM users WHERE LOWER(email) = LOWER($1)',
    values: [email],
  };

  const results = await database.query(query);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O email informado já está sendo usado.`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:VALIDATE_UNIQUE_EMAIL:ALREADY_EXISTS',
      key: 'email',
    });
  }
}

async function hashPasswordInObject(userObject) {
  userObject.password = await authentication.hashPassword(userObject.password);
  return userObject;
}

async function removeFeatures(userId, features) {
  let lastUpdatedUser;

  // TODO: Refactor this function to use a single query
  for (const feature of features) {
    const query = {
      text: `UPDATE users SET
                 features = array_remove(features, $1),
                 updated_at = (now() at time zone 'utc')
             WHERE id = $2
            RETURNING *;`,
      values: [feature, userId],
    };

    const results = await database.query(query);
    lastUpdatedUser = results.rows[0];
  }

  return lastUpdatedUser;
}

async function addFeatures(userId, features) {
  const query = {
    text: `UPDATE users SET
               features = array_cat(features, $1),
               updated_at = (now() at time zone 'utc')
           WHERE id = $2
          RETURNING *;`,
    values: [features, userId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

export default Object.freeze({
  create,
  findAll,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  update,
  removeFeatures,
  addFeatures,
  createAnonymous,
});
