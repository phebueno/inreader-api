module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // resolve @/ para src/
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',  // arquivos de teste unitário
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
