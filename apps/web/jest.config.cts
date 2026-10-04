/// <reference types="node" />

const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  dir: __dirname,
});

const config = {
  displayName: '@visucode/web',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/web',
  testEnvironment: 'jsdom',
};

module.exports = async () => {
  const resolved = await createJestConfig(config)();
  resolved.transformIgnorePatterns = [
    '/node_modules/(?!(next-auth|@auth|jose|@panva|oauth4webapi|preact)/)',
  ];
  return resolved;
};

