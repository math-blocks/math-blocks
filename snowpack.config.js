module.exports = {
    mount: {
        assets: {url: "/", static: true},
        demo: {url: "/demo"},
        packages: {url: "/math-blocks"},
    },
    plugins: [
        // "@snowpack/plugin-dotenv",
        "@snowpack/plugin-react-refresh",
        "@snowpack/plugin-typescript",
    ],
    routes: [
        /* Enable an SPA Fallback in development: */
        {match: "routes", src: ".*", dest: "/index.html"},
    ],
    optimize: {
        /* Example: Bundle your final build: */
        // "bundle": true,
    },
    packageOptions: {
        /* ... */
    },
    devOptions: {
        /* ... */
    },
    buildOptions: {
        /* ... */
    },

    alias: {
        "@math-blocks/core": "./packages/core/src",
        "@math-blocks/editor-core": "./packages/editor-core/src",
        "@math-blocks/grader": "./packages/grader/src",
        "@math-blocks/opentype": "./packages/opentype/src",
        "@math-blocks/parser-factory": "./packages/parser-factory/src",
        "@math-blocks/react": "./packages/react/src",
        "@math-blocks/semantic": "./packages/semantic/src",
        "@math-blocks/solver": "./packages/solver/src",
        "@math-blocks/step-utils": "./packages/step-utils/src",
        "@math-blocks/testing": "./packages/testing/src",
        "@math-blocks/typesetter": "./packages/typesetter/src",
    },
};
