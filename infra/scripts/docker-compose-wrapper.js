/* eslint-disable no-console */
import { spawnSync } from 'child_process';

const isCI = process.env.CI === 'true';

const composeFile = isCI ? 'infra/docker-compose.ci.yml' : 'infra/docker-compose.development.yml';

const args = ['compose', '--env-file', '.env', '-f', composeFile, ...process.argv.slice(2)];

console.log(`🐳 Using: ${composeFile.split('/').pop()}\n`);

const result = spawnSync('docker', args, { stdio: 'inherit' });

process.exit(result.status);
