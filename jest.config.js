module.exports = {
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest",
    },
    moduleNameMapper: {
        "^@math-blocks/(.*)$": "<rootDir>/packages/$1/src/index.ts",
    },
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
};
