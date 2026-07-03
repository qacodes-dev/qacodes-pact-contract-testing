/** Jest config for the provider verification suite. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/provider'],
  testMatch: ['**/*.pact.test.ts'],
  // Verifier boots the app and replays every interaction — keep it patient.
  testTimeout: 60000,
  verbose: true,
};
