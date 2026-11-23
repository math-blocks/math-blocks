# @math-blocks/opentype

## 0.0.15

### Patch Changes

- 737c673: Cache glyph metrics in fonts returned by `parse`. `font.getGlyphMetrics()` now works out a glyph's metrics once and returns the same object on later calls, instead of scanning the glyph's outline every time. Typesetting makes hundreds of these calls per render.
- bcbd9ca: `parse` now reads fonts that only have a BMP-only cmap subtable (platform 3, encoding 1, format 4). It still prefers the platform 3, encoding 10 (format 12) subtable, and falls back to format 4 when a font has no format 12 subtable, or has a (3, 10) subtable in another format. Before, fonts without a format 12 subtable failed with "Missing encoding record for platformID = 3, encodingID = 10".
- 7566931: Add `combineFonts`, which combines the font subsets that have been loaded so far into one `Font` (a `CombinedFont`). More subsets can be added later with `withGroup`, and glyph IDs stay the same as groups are added. `getGlyphID` throws a `GlyphGroupNotLoadedError`, naming the group to load, for a character whose subset isn't loaded yet. Also add `getGlyphGroup`, which returns the group a code point belongs to, and `glyphGroupsForText`, which lists the groups needed to render a string.
- 5a45037: Add `GlyphNotFoundError`, which `getGlyphID` now throws for a character the font can't draw. The message is unchanged. `GlyphGroupNotLoadedError` is now a kind of `GlyphNotFoundError`, so one check handles both.
- 5a45037: Fix `loadFontSubsets` throwing "data.arrayBuffer is not a function" when a loader returns an `ArrayBuffer` created in another realm, such as an iframe or a worker.
- feccdbb: Add `loadFontSubsets`, which loads the font subsets for a list of glyph groups (always including "base") and combines them into a `CombinedFont`, and `fromBaseUrl`, which returns a loader that fetches subsets from a folder of subset files.
- dbeebb1: Fix `loadFontSubsets` in browsers and in jsdom. It imported `Blob` from Node's `buffer` module, so bundlers included a polyfill that fails as the page loads ("global is not defined"). It now parses the subsets' ArrayBuffers directly, without a Blob.

  `parse` now also accepts an ArrayBuffer, and the type of what it reads is exported as `ByteSource`. Blobs work as before.

- 755afc9: Add `glyphGroups`, the groups of characters that the font subsets in `assets/subsets/` are split into, and fix `parse` failing on some valid fonts, such as fonts subset with fontTools:

  - Read CFF charset format 1, which used to throw "Can't parse charset format 1 yet".
  - Read the `MATH` table's glyph info (italic corrections and extended shapes) wherever its subtables are stored. `parse` used to assume they come before the `MathVariants` subtable, and read past the end of its data otherwise.

## 0.0.14

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.

## 0.0.13

### Patch Changes

- 295c78a: Fix `parse` reading negative 2-byte integers in CFF Top and Private DICTs as large positive numbers. For example, a subset of STIX Two Math reported a `FontBBox` of `[-978, 63895, 3072, 2627]` instead of `[-978, -1641, 3072, 2627]`.
