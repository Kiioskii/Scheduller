/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          verbatimModuleSyntax: false,
          module: 'commonjs',
          moduleResolution: 'node',
          paths: { '@/*': ['<rootDir>/src/*'] },
        },
      },
    ],
  },
  testMatch: ['**/*.test.{ts,tsx}'],
};
