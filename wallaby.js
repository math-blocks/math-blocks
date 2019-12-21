module.exports = function(wallaby) {
    return {
        files: [
            "src/**/*.ts",
            "package.json", // <--
            "!src/**/__tests__/*.ts",
        ],

        tests: ["src/**/__tests__/*.ts"],

        env: {
            type: "node",
        },

        testFramework: "jest",

        compilers: {
            "**/*.ts": wallaby.compilers.babel(),
        },

        setup: function(wallaby) {
            var jestConfig = require("./package.json").jest;
            /* for example:
             * jestConfig.globals = { "__DEV__": true }; */
            wallaby.testFramework.configure(jestConfig);
        },
    };
};
