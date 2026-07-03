/** Jest config for the consumer contract suite. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/consumer'],
  testMatch: ['**/*.pact.test.ts'],
  // Pact spins up a mock server; give interactions room and run serially.
  testTimeout: 30000,
  verbose: true,
};
