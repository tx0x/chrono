module.exports = {
    moduleFileExtensions: [
        'js',
        'json',
        'vue'
    ],
    moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules',
        '<rootDir>/public'
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/src/utils',
        '<rootDir>/src/store',
        '<rootDir>/src/api',
        '<rootDir>/src/constants',
        '<rootDir>/src/components',
        '<rootDir>/src/mixin.js',
        '<rootDir>/test/mock.js',
    ],
    transform: {
        '^.+\\.vue$': 'vue-jest',
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
    },
    snapshotSerializers: [
        'jest-serializer-vue'
    ],
    setupFilesAfterEnv: [
        './jest.setup.js'
    ]
}