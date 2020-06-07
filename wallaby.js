module.exports = function(wallaby) {
    return {
        files: [
            "packages/**/*.ts",
            "packages/**/*.tsx",
            "package.json",
            "!packages/**/__tests__/*.ts",
        ],

        tests: ["packages/**/__tests__/*.ts"],

        env: {
            type: "node",
        },

        testFramework: "jest",

        compilers: {
            "**/*.ts": wallaby.compilers.babel(),
        },

        setup: function(wallaby) {
            const path = require("path");
            const jestConfig = require(path.join(
                wallaby.localProjectDir,
                "./jest.config.js",
            ));

            const pattern = "^@math-blocks/(.*)$";
            jestConfig.moduleNameMapper[pattern] = jestConfig.moduleNameMapper[
                pattern
            ]
                .replace("<rootDir>", wallaby.projectCacheDir)
                .replace(".ts", ".js");

            wallaby.testFramework.configure(jestConfig);
        },
    };
};
