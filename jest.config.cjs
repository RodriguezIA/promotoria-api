module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(.+)/generated/prisma/client$': '<rootDir>/src/generated/prisma/stub.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/core/jest.setup.ts'],
  clearMocks: true,
  resetMocks: true,
};
