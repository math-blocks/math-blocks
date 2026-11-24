# @math-blocks/react

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Import the stylesheet with `import '@math-blocks/react/index.css'`. The CSS module class names in it have changed (for example `editor-module_container__UsRAy` is now `rpWC2q_container`), so don't rely on the generated names.

  Breaking: the `exports` map only allows importing the package root, `index.css` and `package.json`. Deep imports into `dist`, such as `@math-blocks/react/dist/index.js` or `@math-blocks/react/dist/index.css`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 1351c0c: Fix `GlyphDefsProvider` painting one frame with no glyph definitions on first render. The provider's hidden `<svg>` now picks up the definitions that renderers add on mount before the browser paints, so math no longer flashes blank when a page loads.
- 1da15cd: `MathRenderer` and `MathEditor` render faster and produce smaller SVG markup. `SceneRenderer` now draws the scene with plain functions instead of one React component per node, so React creates one fiber per SVG element and none for wrappers. On a page of 100 expressions, rendering takes about 15% less script time and the markup is about 15% smaller.

  The markup changes in three ways that don't affect what's drawn:

  - Glyphs that aren't pending no longer get `style="opacity:1"`. Pending glyphs still get `opacity: 0.5`.
  - Translations in `transform` attributes are rounded to a thousandth of a pixel, so values like `translate(68.01599999999999, 0)` become `translate(68.016,0)`. Glyph scales aren't rounded.
  - `<line>` and `<rect>` elements no longer get a stray `type` attribute.

- Updated dependencies [c162c5f]
- Updated dependencies [274cb55]
- Updated dependencies [0f5b5d2]
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/opentype@0.1.0
  - @math-blocks/core@0.1.0
  - @math-blocks/semantic@0.2.0
  - @math-blocks/editor@0.1.0
  - @math-blocks/tex@0.2.0
  - @math-blocks/typesetter@0.1.0

## 0.0.17

### Patch Changes

- 9cf4308: `MathRenderer` and `MathEditor` now store each distinct glyph outline once per SVG, in a `<defs>` block, and draw every occurrence of a glyph with `<use>`. Glyphs render in the same place as before, but the markup is smaller when a glyph repeats. Code that reads the rendered SVG and expects one `<path>` per glyph needs to follow each `<use>` to its definition.
- 5a45037: Draw placeholders for characters the font can't draw, and add an `onMissingGlyph` prop to `MathRenderer` and `MathEditor`. It's called after rendering, once for each missing character, and again only when the set of missing characters changes, so it can safely set state. Rendering either component without a font in `FontDataContext` now fails with a message that says so.
- 5f91a64: Add `GlyphDefsProvider`. Every `MathRenderer` and `MathEditor` inside it shares one hidden `<svg>` of glyph definitions, so a page with lots of math stores each glyph's outline once instead of once per SVG. Without a provider, and when rendering on the server, SVGs keep their own `<defs>` as before. Also add `getStandaloneSvg`, which copies a rendered SVG with the definitions it uses inlined, for copying, downloading or drawing it as an image.
- Updated dependencies [737c673]
- Updated dependencies [bcbd9ca]
- Updated dependencies [7566931]
- Updated dependencies [2ea1981]
- Updated dependencies [5a45037]
- Updated dependencies [5a45037]
- Updated dependencies [feccdbb]
- Updated dependencies [dbeebb1]
- Updated dependencies [755afc9]
- Updated dependencies [5a45037]
  - @math-blocks/opentype@0.0.15
  - @math-blocks/typesetter@0.0.16

## 0.0.16

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
- Updated dependencies [5422428]
- Updated dependencies [c9c0185]
  - @math-blocks/core@0.0.13
  - @math-blocks/editor@0.0.15
  - @math-blocks/opentype@0.0.14
  - @math-blocks/semantic@0.1.2
  - @math-blocks/tex@0.1.2
  - @math-blocks/typesetter@0.0.15

## 0.0.15

### Patch Changes

- Updated dependencies [295c78a]
- Updated dependencies [548281d]
- Updated dependencies [778d07d]
- Updated dependencies [0a9084e]
- Updated dependencies [a5e4ccc]
  - @math-blocks/opentype@0.0.13
  - @math-blocks/semantic@0.1.1
  - @math-blocks/typesetter@0.0.14
  - @math-blocks/editor@0.0.14
  - @math-blocks/tex@0.1.1

## 0.0.14

### Patch Changes

- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [cf4d1ba]
- Updated dependencies [0062515]
- Updated dependencies [0062515]
- Updated dependencies [2d0464c]
- Updated dependencies [0062515]
- Updated dependencies [7c4fdbe]
  - @math-blocks/editor@0.0.13
  - @math-blocks/semantic@0.1.0
  - @math-blocks/tex@0.1.0
  - @math-blocks/typesetter@0.0.13

## 0.0.13

### Patch Changes

- Updated dependencies [9315712]
  - @math-blocks/tex@0.0.13
