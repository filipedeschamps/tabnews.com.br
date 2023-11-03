//import { UnauthorizedError } from 'errors';
import database from 'infra/database.js';
//import cacheControl from 'models/cache-control';
//import validator from 'models/validator.js';

const TOKEN_EXPIRATION_IN_SECONDS = 60 * 10; // 10 minutes

const unmountedTokenSet = new Set([
  'programacao',
  'desenvolvimento',
  'linguagens',
  'inteligencia',
  'artificial',
  'codigo',
  'computacao',
  'ciber',
  'seguranca',
  'iot',
  'cloud',
  'computing',
  'bigdata',
  'redes',
  'web',
  'aplicativos',
  'blockchain',
  'machine',
  'learning',
  'data',
  'science',
  'frontend',
  'backend',
  'seguranca',
  'api',
  'framework',
  'algoritmo',
  'java',
  'javascript',
  'python',
  'cpp',
  'html',
  'css',
  'php',
  'ruby',
  'swift',
  'go',
  'rust',
  'sql',
  'nodejs',
  'react',
  'vuejs',
  'angular',
  'git',
  'devops',
  'open',
  'source',
  'maquina',
  'virtual',
  'compilacao',
  'depuracao',
  'hacker',
  'ciclodevida',
  'repositorio',
  'ide',
  'api',
  'rest',
]);

function createRandomToken() {
  const randomSortedUnmountedTokens = unmountedTokenSet.sort(() => Math.random() - 0.5);
  const mountedToken = randomSortedUnmountedTokens.slice(0, 2).join(' ');

  return mountedToken;
}

async function create() {
  const captchaToken = createRandomToken();
  const expiresAt = new Date(Date.now() + 1000 * TOKEN_EXPIRATION_IN_SECONDS);

  const query = {
    text: `INSERT INTO captchas (token, expires_at)
               VALUES($1, $2) RETURNING *;`,
    values: [captchaToken, expiresAt],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function validate(captchaToken, captchaId, options = {}) {
  const query = {
    text: `
          SELECT
            *
          FROM
            captchas
          WHERE
            id = $1
            AND token = $2
            AND used = false
            AND expires_at <= now()
          RETURNING
            *
          ;`,
    values: [captchaId, captchaToken],
  };

  const results = await database.query(query, options);
  const isAnValidCaptcha = Boolean(results.rows.length);

  if(!isAnValidCaptcha) return false;

  const updateCaptchaQuery = {
    text: `
          UPDATE 
            captchas
          SET 
            used = true
          WHERE 
            id = $1
          ;`,
    values: [captchaId],
  };

  await database.query(updateCaptchaQuery, options);

  return true;
}

export default Object.freeze({
  create,
  validate,
});
