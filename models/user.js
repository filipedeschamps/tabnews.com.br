import database from 'infra/database.js';
import Joi from 'joi';
import { ValidationError, NotFoundError } from 'errors/index.js';

export default function User() {
  async function findAll() {
    try {
      const query = {
        text: 'SELECT * FROM users ORDER BY created_at ASC;',
      };
      const results = await database.query(query);
      return results.rows;
    } catch (error) {
      throw error;
    }
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

  async function create(postedUserData) {
    try {
      const validUserData = await validatePostSchema(postedUserData);
      await validateUniqueUsername(validUserData.username);
      await validateUniqueEmail(validUserData.email);
      const newUser = await insertIntoDatabase(validUserData);
      return newUser;
    } catch (error) {
      throw error;
    }

    async function insertIntoDatabase(data) {
      const { username, email, password } = data;

      const query = {
        text: 'INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING *;',
        values: [username, email, password],
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

  async function update(username, postedUserData) {
    const validPostedUserData = await validatePatchSchema(postedUserData);
    const currentUser = await findOneByUsername(username);

    if ('username' in validPostedUserData) {
      await validateUniqueUsername(validPostedUserData.username);
    }

    if ('email' in validPostedUserData) {
      await validateUniqueEmail(validPostedUserData.email);
    }

    const newUser = { ...currentUser, ...validPostedUserData };

    try {
      const query = {
        text: `UPDATE users SET
                username = $1,
                email = $2,
                password = $3,
                updated_at = (now() at time zone 'utc')
                WHERE username = $4
                RETURNING *;`,
        values: [newUser.username, newUser.email, newUser.password, currentUser.username],
      };

      const results = await database.query(query);
      return results.rows[0];
    } catch (error) {
      throw error;
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

  function coerceUserData(userData) {
    const coercedUserData = userData;

    if ('email' in userData) {
      coercedUserData.email = userData.email.toString().toLowerCase();
    }

    return coercedUserData;
  }

  return {
    create,
    findAll,
    findOneByUsername,
    update,
  };
}
