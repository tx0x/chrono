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
    transform: {
        '^.+\\.vue$': 'vue-jest',
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
    },
    snapshotSerializers: [
        'jest-serializer-vue'
    ]
}