import Joi from 'joi';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import { ValidationError, NotFoundError } from 'errors/index.js';

async function findAll() {
  const query = {
    text: 'SELECT * FROM users ORDER BY created_at ASC;',
  };
  const results = await database.query(query);
  return results.rows;
}

async function findOneByUsername(username) {
  const query = {
    text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;',
    values: [username],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O username "${username}" não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

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
    });
  }

  return results.rows[0];
}

async function create(postedUserData) {
  const validUserData = await validatePostSchema(postedUserData);
  await validateUniqueUsername(validUserData.username);
  await validateUniqueEmail(validUserData.email);
  await hashPasswordInObject(validUserData);

  const defaultValues = {
    features: ['read:activation_token'],
  };

  const finalValues = { ...validUserData, ...defaultValues };

  const newUser = await runInsertQuery(finalValues);
  return newUser;

  async function runInsertQuery(finalValues) {
    const query = {
      text: 'INSERT INTO users (username, email, password, features) VALUES($1, $2, $3, $4) RETURNING *;',
      values: [finalValues.username, finalValues.email, finalValues.password, finalValues.features],
    };
    const results = await database.query(query);
    return results.rows[0];
  }
}

async function validatePostSchema(postedUserData) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).trim().required().messages({
      'any.required': `"username" é um campo obrigatório.`,
      'string.empty': `"username" não pode estar em branco.`,
      'string.base': `"username" deve ser do tipo String.`,
      'string.alphanum': `"username" deve conter apenas caracteres alfanuméricos.`,
      'string.min': `"username" deve conter no mínimo {#limit} caracteres.`,
      'string.max': `"username" deve conter no máximo {#limit} caracteres.`,
    }),
    email: Joi.string().email().min(7).max(254).lowercase().trim().required().messages({
      'any.required': `"email" é um campo obrigatório.`,
      'string.empty': `"email" não pode estar em branco.`,
      'string.base': `"email" deve ser do tipo String.`,
      'string.email': `"email" deve conter um email válido.`,
    }),
    // Why 72 in max length? https://security.stackexchange.com/a/39851
    password: Joi.string().min(8).max(72).trim().required().messages({
      'any.required': `"password" é um campo obrigatório.`,
      'string.empty': `"password" não pode estar em branco.`,
      'string.base': `"password" deve ser do tipo String.`,
      'string.min': `"password" deve conter no mínimo {#limit} caracteres.`,
      'string.max': `"password" deve conter no máximo {#limit} caracteres.`,
    }),
  });

  const { error, value } = schema.validate(postedUserData, { stripUnknown: true });

  if (error) {
    throw new ValidationError({ message: error.details[0].message, stack: new Error().stack });
  }

  return value;
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

// TODO: Verify if it's interesting the idea of merging
// the POST and PATCH schema since (for now) the only
// differences are the .required() validations and messages.
async function validatePatchSchema(userData) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).trim().messages({
      'string.empty': `"username" não pode estar em branco.`,
      'string.base': `"username" deve ser do tipo String.`,
      'string.alphanum': `"username" deve conter apenas caracteres alfanuméricos.`,
      'string.min': `"username" deve conter no mínimo {#limit} caracteres.`,
      'string.max': `"username" deve conter no máximo {#limit} caracteres.`,
    }),
    email: Joi.string().email().min(7).max(254).lowercase().trim().messages({
      'string.empty': `"email" não pode estar em branco.`,
      'string.base': `"email" deve ser do tipo String.`,
      'string.email': `"email" deve conter um email válido.`,
    }),
    password: Joi.string().min(8).max(72).trim().messages({
      'any.required': `"password" é um campo obrigatório.`,
      'string.empty': `"password" não pode estar em branco.`,
      'string.base': `"password" deve ser do tipo String.`,
      'string.min': `"password" deve conter no mínimo {#limit} caracteres.`,
      'string.max': `"password" deve conter no máximo {#limit} caracteres.`,
    }),
    features: Joi.array().items(Joi.string()).messages({
      'array.base': `"features" deve ser do tipo Array.`,
    }),
  });

  const { error, value } = schema.validate(userData, { stripUnknown: true });

  if (error) {
    throw new ValidationError({ message: error.details[0].message, stack: new Error().stack });
  }

  return value;
}

async function validateUniqueUsername(username) {
  const query = {
    text: 'SELECT username FROM users WHERE LOWER(username) = LOWER($1)',
    values: [username],
  };

  const results = await database.query(query);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O username "${username}" já está sendo usado.`,
      stack: new Error().stack,
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
      message: `O email "${email}" já está sendo usado.`,
      stack: new Error().stack,
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
  findOneById,
  update,
  removeFeatures,
  addFeatures,
});
