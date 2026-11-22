module.exports = {
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss)$': 'jest-css-modules-transform',
  },
  modulePathIgnorePatterns: ['/out/', '/dist/', './.rollup.cache'],
  // Playwright runs the end-to-end tests in e2e/; see playwright.config.ts.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@math-blocks/(.*)$': '<rootDir>/packages/$1/src/index.ts',
    // Load a .js file with no exports whenever an .otf file is requested.
    '\\.(otf)$': '<rootDir>/font-mock.js',
  },
  collectCoverageFrom: ['packages/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/stories/',
    '\\.d\\.ts',
    '\\/test-util\\.ts$',
    // Test-only helpers for parsing and printing plain-text math.
    '/packages/tutor/src/testing/',
  ],
  setupFilesAfterEnv: ['./jest.setup.cjs'],
};
