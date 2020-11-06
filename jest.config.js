
module.exports = {
    "transform": {
      "^.+\\.tsx?$": "ts-jest",
      "^.+\\.js$": "./node_modules/babel-jest"
    },
    "roots": [
      "src"
    ],
    "moduleDirectories": [
      "node_modules",
      "src",
    ],
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ],
    coverageReporters: ['json-summary', 'text', 'lcov'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/node_modules/**', '!**/vendor/**'],
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
      '<rootDir>/spec/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
    ]
};
