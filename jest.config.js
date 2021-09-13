module.exports = {
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
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
        "\\.d\\.ts",
        "**/test-util.ts",
    ],
    setupFilesAfterEnv: ["./jest.setup.js"],
};
