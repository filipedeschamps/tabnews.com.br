const defaultConfig = {
  '*.{js,mjs,cjs,jsx}': (stagedFiles) => [
    `eslint --fix --max-warnings 0 ${stagedFiles.join(' ')}`,
    `prettier --write ${stagedFiles.join(' ')}`,
  ],
  '*.{json,md}': (stagedFiles) => [`prettier --write ${stagedFiles.join(' ')}`],
};

const npm = {
  ...defaultConfig,
  '**/{package.json,package-lock.json}': () => ['npm install', 'git add package-lock.json'],
  '**/{pnpm-lock.yaml,yarn.lock}': lockFileError,
};

const pnpm = {
  ...defaultConfig,
  '**/{package.json,pnpm-lock.yaml}': () => ['pnpm install', 'git add pnpm-lock.yaml'],
  '**/{package-lock.json,yarn.lock}': lockFileError,
};

const yarn = {
  ...defaultConfig,
  '**/{package.json,yarn.lock}': () => ['yarn install', 'git add yarn.lock'],
  '**/{package-lock.json,pnpm-lock.yaml}': lockFileError,
};

function lockFileError(stagedFiles) {
  if (stagedFiles.length) {
    let message = '[ERROR]: Detected lock file(s) from a different package manager in the staged changes:\n';
    stagedFiles.forEach((file) => (message += `  - ${file}\n`));
    message += 'Please remove them before proceeding with the commit.';
    console.error(message);
    throw new Error(message);
  }
  return '';
}

exports.npm = npm;
exports.pnpm = pnpm;
exports.yarn = yarn;
exports.default = defaultConfig;
