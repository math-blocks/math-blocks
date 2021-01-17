module.exports = {
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest",
    },
    modulePathIgnorePatterns: ["/out/"],
    moduleNameMapper: {
        "^@math-blocks/(.*)$": "<rootDir>/packages/$1/src/index.ts",
    },
    collectCoverageFrom: ["packages/**/*.{ts,tsx}"],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/stories/",
        "packages/grader/src/test-util.ts",
        "packages/solver/src/test-util.ts",
    ],
};
