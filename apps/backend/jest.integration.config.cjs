const { jest: base } = require('./package.json');

// Real Postgres, so suites share one database: run them in band (see test:integration).
module.exports = {
  ...base,
  // The mail templates are .tsx; unit tests never import them.
  moduleFileExtensions: [...base.moduleFileExtensions, 'tsx'],
  transform: { ...base.transform, '^.+\\.tsx$': 'ts-jest' },
  testRegex: '\\.e2e-spec\\.ts$',
  globalSetup: '<rootDir>/test/global-setup.ts',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
};
