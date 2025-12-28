/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Only run server-side tests
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  // Load environment variables from .env.local
  setupFiles: ["<rootDir>/src/__tests__/setup-env.ts"],
};
