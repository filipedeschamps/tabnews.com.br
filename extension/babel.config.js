const path = require('path');
const sharedPackage = require('../package.json');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: false,
        // Do not transform modules to CJS
        modules: false,
        targets: {
          chrome: '49',
          firefox: '52',
          opera: '36',
          edge: '79',
        },
      },
    ],
    '@babel/react',
  ],
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['.'],
        alias: {
          // Required to remove duplicate dependencies from the build
          ...Object.keys(sharedPackage.devDependencies).reduce((acc, dep) => {
            if (["postcss", "tailwindcss"].find((name) => name === dep)) {
              return {
                ...acc,
                [dep]: path.resolve('./node_modules/preact/compat'),
              };
            }
            return { ...acc, [dep]: path.resolve(`./node_modules/${dep}`) };
          }, {}),
        },
      },
    ],
  ],
  env: {
    test: {
      presets: ['@babel/preset-env', '@babel/react'],
    },
  },
}