import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'node:fs';

import { done, info, warning } from './logger.js';

export function load(cliOption, defaultCommandMode) {
  const mode = getMode(cliOption, defaultCommandMode);

  display(mode);

  loadEnvFile(`.env.${mode}.local`);
  loadEnvFile('.env.local');
  loadEnvFile(`.env.${mode}`);
  loadEnvFile('.env');
}

export function getMode(cliOption, defaultCommandMode) {
  return cliOption || process.env.NODE_ENV || defaultCommandMode || 'development';
}

export function display(mode) {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && nodeEnv !== mode) {
    warning(`NODE_ENV=${nodeEnv}, but loading envs for ${mode}`);
  } else {
    info(`Loading envs for ${mode}`);
  }
}

export function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envConfig = dotenv.config({ path: filePath });
    dotenvExpand.expand(envConfig);
    done(`Loaded file: ${filePath}`);
  }
}
