import { renderAsync } from '@resvg/resvg-js';
import fs from 'node:fs';
import { join, resolve } from 'node:path';
import satori from 'satori';

import database from 'infra/database.js';
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
  const randomSortedUnmountedTokens = Array.from(unmountedTokenSet).sort(() => Math.random() - 0.5);
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
          ;`,
    values: [captchaId, captchaToken],
  };

  const results = await database.query(query, options);
  const isAnValidCaptcha = Boolean(results.rows.length && new Date(results.rows[0].expiresAt < new Date()));
  if (!isAnValidCaptcha) return false;

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

async function asPng(captchaToken) {
  const svg = await satori(renderTemplate(captchaToken), {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Roboto',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'Roboto-Regular.ttf')),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Roboto',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'Roboto-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
      {
        name: 'NotoEmoji',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'NotoEmoji-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const renderBuffer = await renderAsync(svg);
  return renderBuffer.asPng();
}

export function renderTemplate(captchaToken) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '80px 60px 60px',
        fontFamily: 'Roboto',
        fontSize: '20pt',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        filter: 'blur(4px)',
      }}>
      <span>{captchaToken}</span>
    </div>
  );
}

export default Object.freeze({
  create,
  validate,
  asPng,
});
