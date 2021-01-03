module.exports = {
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest",
    },
    modulePathIgnorePatterns: ["<rootDir>/out/"],
    moduleNameMapper: {
        "^@math-blocks/(.*)$": "<rootDir>/packages/$1/src/index.ts",
    },
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "packages/grader/src/test-util.ts",
        "packages/solver/src/test-util.ts",
    ],
};
