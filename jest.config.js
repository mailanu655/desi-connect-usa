/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/packages'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/packages/**/tests/**/*.test.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        noImplicitAny: false,
      }
    }
  },
  moduleNameMapper: {
    '^@desi-connect/shared$': '<rootDir>/packages/shared/src',
    '^@desi-connect/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@desi-connect/database$': '<rootDir>/packages/database/src',
    '^@desi-connect/database/(.*)$': '<rootDir>/packages/database/src/$1',
    '^@desi-connect/middleware$': '<rootDir>/packages/middleware/src',
    '^@desi-connect/middleware/(.*)$': '<rootDir>/packages/middleware/src/$1',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/web/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  verbose: true,
  testTimeout: 30000,
};
