const { npm } = require('@tabnews/config/lint-staged');

module.exports = {
  ...npm,
  'package.json': 'npmPkgJsonLint .',
};
