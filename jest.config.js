module.exports = {
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest",
    },
    modulePathIgnorePatterns: ["/out/"],
    moduleNameMapper: {
        "^@math-blocks/(.*)$": "<rootDir>/packages/$1/src/index.ts",
        // Load a .js file with no exports whenever an .otf file is requested.
        "\\.(otf)$": "<rootDir>/font-mock.js",
    },
    collectCoverageFrom: ["packages/**/*.{ts,tsx}"],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/stories/",
        "packages/grader/src/test-util.ts",
        "packages/solver/src/test-util.ts",
    ],
    setupFilesAfterEnv: ["./jest.setup.js"],
};
