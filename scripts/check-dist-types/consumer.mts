// A consumer of the published packages. check.mjs links each package into
// ./node_modules, so these resolve through each package's "exports" to its
// built dist/index.d.mts, as they would for a project that installs them.
// The .mts extension keeps this an ES module whatever the nearest package.json
// says.
export * as Core from '@math-blocks/core';
export * as Editor from '@math-blocks/editor';
export * as OpenType from '@math-blocks/opentype';
export * as Parser from '@math-blocks/parser';
export * as ReactPackage from '@math-blocks/react';
export * as Semantic from '@math-blocks/semantic';
export * as Solver from '@math-blocks/solver';
export * as Tex from '@math-blocks/tex';
export * as Tutor from '@math-blocks/tutor';
export * as Typesetter from '@math-blocks/typesetter';
