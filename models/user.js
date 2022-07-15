import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import validator from 'models/validator.js';
import balance from 'models/balance.js';
import { ValidationError, NotFoundError } from 'errors/index.js';

async function findAll() {
  const query = {
    text: `
      SELECT
        *
      FROM
        users
      CROSS JOIN LATERAL (
        SELECT
          get_current_balance('user:tabcoin', users.id) as tabcoins,
          get_current_balance('user:tabcash', users.id) as tabcash
      ) as balance
      ORDER BY
        created_at ASC
      ;`,
  };
  const results = await database.query(query);
  return results.rows;
}

async function findOneByUsername(username) {
  const query = {
    text: `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
      )
      SELECT
        user_found.*,
        get_current_balance('user:tabcoin', user_found.id) as tabcoins,
        get_current_balance('user:tabcash', user_found.id) as tabcash
      FROM
        user_found
      ;`,
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

async function findOneByEmail(email) {
  const query = {
    text: `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
      )
      SELECT
        user_found.*,
        get_current_balance('user:tabcoin', user_found.id) as tabcoins,
        get_current_balance('user:tabcash', user_found.id) as tabcash
      FROM
        user_found
      ;`,
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
    text: `
      WITH user_found AS (
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
      )
      SELECT
        user_found.*,
        get_current_balance('user:tabcoin', user_found.id) as tabcoins,
        get_current_balance('user:tabcash', user_found.id) as tabcash
      FROM
        user_found
      ;`,
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
  checkBlockedUsernames(validUserData.username);
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

function checkBlockedUsernames(username) {
  const blockedUsernames = [
    'tabnew',
    'tabnews',
    'contato',
    'contatos',
    'moderador',
    'moderadores',
    'moderadora',
    'moderadoras',
    'moderadores',
    'moderacao',
    'alerta',
    'alertas',
    'dados',
    'status',
    'estatisticas',
    'analytics',
    'auth',
    'authentication',
    'autenticacao',
    'autorizacao',
    'loja',
    'log',
    'login',
    'logout',
    'avatar',
    'backup',
    'banner',
    'banners',
    'beta',
    'blog',
    'posts',
    'category',
    'categories',
    'categoria',
    'categorias',
    'tags',
    'grupo',
    'grupos',
    'checkout',
    'carrinho',
    'comentario',
    'comentarios',
    'comunidade',
    'comunidades',
    'vagas',
    'curso',
    'cursos',
    'sobre',
    'conta',
    'contas',
    'anuncio',
    'anucios',
    'anuncie',
    'anunciar',
    'afiliado',
    'afiliados',
    'criar',
    'create',
    'postar',
    'post',
    'publicar',
    'publish',
    'editar',
    'editor',
    'edit',
    'configuracao',
    'configuracoes',
    'configurar',
    'configure',
    'config',
    'preferencias',
    'conta',
    'account',
    'dashboard',
    'sair',
    'deslogar',
    'desconectar',
    'discussao',
    'documentacao',
    'download',
    'downloads',
    'draft',
    'rascunho',
    'app',
    'apps',
    'admin',
    'administrator',
    'administrador',
    'administradora',
    'administradores',
    'administracao',
    'suporte',
    'support',
    'pesquisa',
    'sysadmin',
    'superuser',
    'sudo',
    'root',
    'user',
    'users',
    'rootuser',
    'guest',
    'anonymous',
    'faq',
    'tag',
    'tags',
    'hoje',
    'ontem',
    'pagina',
    'trending',
    'username',
    'usuario',
    'usuarios',
    'email',
    'password',
    'senha',
    'docs',
    'documentacao',
    'guidelines',
    'diretrizes',
    'ajuda',
    'imagem',
    'imagens',
    'convite',
    'convites',
    'toc',
    'terms',
    'termos',
    'regras',
    'contrato',
    'cultura',
    'licenca',
    'rss',
    'newsletter',
    'newsletters',
    'notification',
    'notifications',
    'notificacoes',
    'popular',
    'cadastro',
    'cadastrar',
    'register',
    'registration',
    'resposta',
    'respostas',
    'replies',
    'reply',
    'relatorio',
    'relatorios',
    'resetar',
    'resetar-senha',
    'ceo',
    'cfo',
    'cto',
    'gerente',
    'membership',
    'news',
    'api',
    'css',
    'init',
    'museu',
    'upgrade',
    'features',
    'me',
    'perfil',
    'eu',
    'videos',
  ];

  if (blockedUsernames.includes(username.toLowerCase())) {
    throw new ValidationError({
      message: `Este nome de usuário não está disponível para uso.`,
      action: 'Escolha outro nome de usuário e tente novamente.',
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:USER:CHECK_BLOCKED_USERNAMES:BLOCKED_USERNAME',
      key: 'username',
    });
  }
}

// TODO: Refactor the interface of this function
// and the code inside to make it more future proof
// and to accept update using "userId".
async function update(username, postedUserData) {
  const validPostedUserData = await validatePatchSchema(postedUserData);
  const currentUser = await findOneByUsername(username);

  if ('username' in validPostedUserData) {
    checkBlockedUsernames(validPostedUserData.username);
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
      text: `
        UPDATE
          users
        SET
          username = $1,
          email = $2,
          password = $3,
          updated_at = (now() at time zone 'utc')
        WHERE
          id = $4
        RETURNING
          *
      ;`,
      values: [
        userWithUpdatedValues.username,
        userWithUpdatedValues.email,
        userWithUpdatedValues.password,
        currentUser.id,
      ],
    };

    const results = await database.query(query);

    const updatedUser = results.rows[0];
    updatedUser.tabcoins = await balance.getTotal('user:tabcoin', updatedUser.id);
    updatedUser.tabcash = await balance.getTotal('user:tabcash', updatedUser.id);

    return updatedUser;
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

    const results = await database.query(query);
    lastUpdatedUser = results.rows[0];
  }

  lastUpdatedUser.tabcoins = await balance.getTotal('user:tabcoin', lastUpdatedUser.id);
  lastUpdatedUser.tabcash = await balance.getTotal('user:tabcash', lastUpdatedUser.id);

  return lastUpdatedUser;
}

async function addFeatures(userId, features) {
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

  const results = await database.query(query);

  const updatedUser = results.rows[0];
  updatedUser.tabcoins = await balance.getTotal('user:tabcoin', updatedUser.id);
  updatedUser.tabcash = await balance.getTotal('user:tabcash', updatedUser.id);

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
