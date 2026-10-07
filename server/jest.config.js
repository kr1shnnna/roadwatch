module.exports = {
  testEnvironment: "node",

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js",
  ],

  testMatch: [
    "**/tests/**/*.test.js",
  ],

  clearMocks: true,

  testTimeout: 30000,
};
