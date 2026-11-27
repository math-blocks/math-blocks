# @math-blocks/typesetter

## 0.1.1

### Patch Changes

- cc25bba: Lint fix from `prefer-nullish-coalescing`: `findIntersections` defaults `translation` with `??=`. No change in behavior.
- Updated dependencies [cc25bba]
- Updated dependencies [cc25bba]
- Updated dependencies [ec79e2f]
  - @math-blocks/editor@0.1.1
  - @math-blocks/opentype@0.2.0

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/typesetter/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 47f0afb: Lint fixes from oxlint's type-aware rules: re-export `./types` with `export type *`, since it only has types, and replace the `@ts-expect-error` comments around the cancel line in the scene graph with a typed variable. No change in behavior.
- Updated dependencies [c162c5f]
- Updated dependencies [274cb55]
- Updated dependencies [0f5b5d2]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/opentype@0.1.0
  - @math-blocks/core@0.1.0
  - @math-blocks/editor@0.1.0

## 0.0.16

### Patch Changes

- 2ea1981: Add `glyphGroupsForRow`, which returns the glyph groups needed to typeset an editor tree, including characters the typesetter draws that aren't in the tree as characters, such as accents, the radical sign and math-italic letters.
- 5a45037: Draw characters the font can't draw, for example because their glyph group isn't loaded, as a placeholder instead of throwing. `Context` gets an optional `recordMissingGlyph` callback that's told about each one, and `Glyph` layout nodes get an optional `placeholder` field.
- Updated dependencies [737c673]
- Updated dependencies [bcbd9ca]
- Updated dependencies [7566931]
- Updated dependencies [5a45037]
- Updated dependencies [5a45037]
- Updated dependencies [feccdbb]
- Updated dependencies [dbeebb1]
- Updated dependencies [755afc9]
  - @math-blocks/opentype@0.0.15

## 0.0.15

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
  - @math-blocks/core@0.0.13
  - @math-blocks/editor@0.0.15
  - @math-blocks/opentype@0.0.14

## 0.0.14

### Patch Changes

- Updated dependencies [295c78a]
  - @math-blocks/opentype@0.0.13
  - @math-blocks/editor@0.0.14

## 0.0.13

### Patch Changes

- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
- Updated dependencies [2d0464c]
- Updated dependencies [0062515]
  - @math-blocks/editor@0.0.13
