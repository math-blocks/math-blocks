module.exports = function(wallaby) {
    return {
        files: [
            "src/**/*.js",
            "package.json", // <--
            "!src/**/__tests__/*.js",
        ],

        tests: ["src/**/__tests__/*.js"],

        env: {
            type: "node",
        },

        testFramework: "jest",

        compilers: {
            "**/*.js": wallaby.compilers.babel(),
        },

        setup: function(wallaby) {
            var jestConfig = require("./package.json").jest;
            /* for example:
             * jestConfig.globals = { "__DEV__": true }; */
            wallaby.testFramework.configure(jestConfig);
        },
    };
};
