# @math-blocks/fonts

The math fonts that `@math-blocks/react` renders with. You don't use these
files directly: they're loaded with `loadFontSubsets` from
`@math-blocks/opentype` and passed to `@math-blocks/react` through
`FontDataContext`. A simpler setup in `@math-blocks/react` is planned in
[#881](https://github.com/math-blocks/math-blocks/issues/881).

Each font is split into one small WOFF file per glyph group (see `glyphGroups`
in `@math-blocks/opentype`), so a page only downloads the characters it uses.
They need `DecompressionStream`, which current browsers and Node 18+ have.

## Using the fonts with `@math-blocks/react`

Make the package's `subsets/` folder available at a URL, load the glyph
groups you need, and provide the result:

```tsx
import { fromBaseUrl, getFontData, loadFontSubsets } from '@math-blocks/opentype';
import { FontDataContext, MathRenderer } from '@math-blocks/react';

const font = await loadFontSubsets(
  ['base', 'calculus'],
  fromBaseUrl('/fonts/stix-two-math'),
);

<FontDataContext.Provider value={getFontData(font, 'stix-two-math')}>
  <MathRenderer row={row} />
</FontDataContext.Provider>;
```

Ways to get the files to a URL:

- **Your app's static folder.** Copy `node_modules/@math-blocks/fonts/subsets/`
  into it, e.g. `public/fonts/` with Vite or rsbuild, or with a copy plugin in
  rspack or webpack. The copied files don't get hashed names, so include the
  package version in the folder name or set suitable cache headers.
- **An npm CDN**, with no copying:
  `fromBaseUrl('https://cdn.jsdelivr.net/npm/@math-blocks/fonts@<version>/subsets/stix-two-math')`.

For server rendering, read the files from disk instead: `subsetPath(folder,
group)` gives a file's path inside the package, for
`require.resolve('@math-blocks/fonts/' + subsetPath(...))`.

## What's in the package

```
subsets/
  stix-two-math/
    base.woff  calculus.woff  linear-algebra.woff  ...
  latin-modern-math/
  tex-gyre-bonum-math/
  tex-gyre-pagella-math/
  tex-gyre-schola-math/
  tex-gyre-termes-math/
licenses/
  OFL-1.1.txt  GUST-FONT-LICENSE.txt  LPPL-1.3c.txt
```

## Exports

- `fonts`: every font in the package. Each has its display `name`, its
  `folder` in `subsets/`, the `family` name inside the subset files, the
  `source` font it was made from, its `license`, and the `licenseFile` that
  holds the licence's text.
- `getFont(folder)`: the font in `subsets/<folder>/`, or `undefined`.
- `subsetPath(folder, group)`: a subset file's path inside the package, such
  as `subsets/stix-two-math/base.woff`.
- `FONT_FOLDERS`: every font's folder, in order. `isFontFolder(folder)`
  checks a string against it.
- Types: `MathFont`, `FontFolder` (the union of the folder names, so a typo
  such as `'stix-two-mat'` is a type error), `FontLicense`.

## Licences

The JavaScript is MIT-licensed. The fonts keep their original licences:
STIX Two Math is under the SIL Open Font License 1.1, and Latin Modern Math
and the TeX Gyre fonts are under the GUST Font License. See
[LICENSE.md](LICENSE.md) for details and copyright notices.

## Updating the subsets

The subsets are built from the fonts in the repository's `assets/` folder by
`scripts/subset-fonts.py`, using the list in `src/fonts.json`, which writes
them straight to WOFF. To add a font,
add an entry there, put its source file in `assets/`, and run
`python3 scripts/subset-fonts.py`.

The script also writes `src/fonts.generated.ts`, which lists the folders as a
TypeScript `as const` array for the `FontFolder` type: TypeScript reads
strings imported from JSON as plain `string`. Don't edit it by hand. A unit
test fails if it doesn't match `fonts.json`.
