# @math-blocks/typesetter

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
