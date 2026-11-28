import { defineConfig } from 'tsdown';

// Builds every package in packages/* from src/index.ts into dist/:
//   index.mjs + index.d.mts  (ESM)
//   index.js  + index.d.ts   (CJS)
//   index.css                (packages/react only, extracted CSS modules)
export default defineConfig({
  workspace: 'packages/*',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2018',
  // rolldown-plugin-dts generates the declarations with TypeScript 7 (the
  // `tsgo` generator), because the TypeScript 7 package has no JavaScript API
  // for the `tsc` generator.
  dts: true,
  clean: true,
  deps: {
    // tsdown externalizes each package's dependencies and peerDependencies,
    // but some packages don't declare everything they import yet (e.g. grader
    // imports @math-blocks/parser), so list the runtime imports explicitly.
    neverBundle: [
      /^@math-blocks\//,
      'classnames',
      'fraction.js',
      /^react(-dom)?(\/|$)/,
      // packages/react's keyboard shortcuts.
      /^@tanstack\/(react-)?hotkeys$/,
    ],
    // Fail the build if anything from node_modules would be inlined.
    onlyBundle: [],
  },
  css: {
    // Merge the CSS modules imported by packages/react into dist/index.css.
    fileName: 'index.css',
    minify: true,
    lightningcss: {
      // Hash CSS module class names from repo-relative paths so the names
      // don't depend on where the repo is checked out.
      projectRoot: import.meta.dirname,
    },
  },
  checks: {
    // The dts workers run in parallel across packages, which makes Rolldown
    // print timing reports on every build.
    bundlerTimings: false,
  },
  suppressWarnings: [
    // @tsdown/css compiles each *.module.css file to a module with string
    // export names (`export { _key0 as "container" }`), which ES2018 doesn't
    // allow. Rolldown inlines these as a plain object, so the output is fine.
    /Arbitrary module namespace identifier names/,
    // On TypeScript 7.0, rolldown-plugin-dts runs the tsgo CLI, and warns once
    // per package and format that this backend is deprecated in favor of
    // TypeScript 7.1's API. The output is fine; remove this once we're on 7.1.
    /The `tsgo` generator on TypeScript 7\.0 is deprecated/,
  ],
});
