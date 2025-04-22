const defaultConfig = require('@tabnews/config/eslint');

const config = [
  ...defaultConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          args: 'after-used',
          caughtErrors: 'none',
        },
      ],
    },
  },
];

module.exports = config;
