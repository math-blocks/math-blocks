import path from 'path';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

const external = [
  'assert',
  'classnames',
  'react',
  'react-dom',
  'fraction.js',
  '@math-blocks/core',
  '@math-blocks/editor',
  '@math-blocks/opentype',
  '@math-blocks/parser',
  '@math-blocks/react',
  '@math-blocks/semantic',
  '@math-blocks/solver',
  '@math-blocks/tex',
  '@math-blocks/typesetter',
];

const createBuildConfig = (name) => {
  return {
    input: `packages/${name}/src/index.ts`,
    external: external,
    output: {
      file: `packages/${name}/dist/index.js`,
      format: 'cjs',
    },
    plugins: [
      typescript({
        outputToFilesystem: false,
        tsconfig: `./packages/${name}/tsconfig.rollup.json`,
      }),
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
  };
};

export default [
  createBuildConfig('core'),
  createBuildConfig('editor'),
  createBuildConfig('opentype'),
  createBuildConfig('parser'),
  createBuildConfig('react'),
  createBuildConfig('semantic'),
  createBuildConfig('solver'),
  createBuildConfig('tex'),
  createBuildConfig('typesetter'),
];
