import path from "path";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";

const external = [
    "assert",
    "classnames",
    "react",
    "react-dom",
    "fraction.js",
    "@math-blocks/core",
    "@math-blocks/editor",
    "@math-blocks/opentype",
    "@math-blocks/parser",
    "@math-blocks/react",
    "@math-blocks/semantic",
    "@math-blocks/solver",
    "@math-blocks/testing",
    "@math-blocks/tutor",
    "@math-blocks/typesetter",
];

const createBuildConfig = (name) => {
    return {
        input: `packages/${name}/src/index.ts`,
        external: external,
        output: {
            file: `packages/${name}/dist/index.js`,
            format: "es",
        },
        plugins: [
            typescript({
                outputToFilesystem: false,
                typescript: require("typescript"),
                tsconfig: path.resolve(
                    __dirname,
                    `packages/${name}/tsconfig.rollup.json`,
                ),
            }),
            commonjs(),
            postcss({
                extract: true,
                minimize: true,
            }),
        ],
    };
};

const config = [
    createBuildConfig("core"),
    createBuildConfig("editor"),
    createBuildConfig("opentype"),
    createBuildConfig("parser"),
    createBuildConfig("react"),
    createBuildConfig("semantic"),
    createBuildConfig("solver"),
    createBuildConfig("testing"),
    createBuildConfig("tutor"),
    createBuildConfig("typesetter"),
];

export default config;
