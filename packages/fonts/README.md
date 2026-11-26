# @math-blocks/fonts

The math font subsets that `@math-blocks/react` renders with, in OpenType
(`.otf`) and WOFF (`.woff`) formats, plus a list of the fonts.

Each font is split into one small file per glyph group (see `glyphGroups` in
`@math-blocks/opentype`), so an app only downloads the characters it uses.
The `.woff` files hold the same fonts compressed and are about a third
smaller. `@math-blocks/opentype` reads both formats.

## What's in the package

```
subsets/
  stix-two-math/
    base.otf  base.woff  calculus.otf  calculus.woff  ...
  latin-modern-math/
  tex-gyre-bonum-math/
  tex-gyre-pagella-math/
  tex-gyre-schola-math/
  tex-gyre-termes-math/
licenses/
  OFL-1.1.txt  GUST-FONT-LICENSE.txt  LPPL-1.3c.txt
```

The package doesn't include the full original fonts.

## Loading the fonts

The package doesn't fetch anything itself. Serve the files however suits your
app, then load them with `loadFontSubsets` from `@math-blocks/opentype`.

### In a browser

Copy `node_modules/@math-blocks/fonts/subsets/` to your static files or CDN,
for example as `/fonts/`, and fetch the `.woff` files from there:

```ts
import { loadFontSubsets, fromBaseUrl, getFontData } from '@math-blocks/opentype';

const font = await loadFontSubsets(
  ['calculus'],
  fromBaseUrl('/fonts/stix-two-math', { format: 'woff' }),
);
const fontData = getFontData(font, 'stix-two-math');
```

With a bundler that supports asset URLs, you can import a file's URL instead.
In Vite, for example:
`import url from '@math-blocks/fonts/subsets/stix-two-math/base.woff?url'`.

### In Node

```ts
import fs from 'fs';
import { createRequire } from 'module';
import { subsetPath } from '@math-blocks/fonts';
import { loadFontSubsets } from '@math-blocks/opentype';

const require = createRequire(import.meta.url);
const font = await loadFontSubsets(['calculus'], async (group) =>
  new Uint8Array(
    fs.readFileSync(
      require.resolve(`@math-blocks/fonts/${subsetPath('stix-two-math', group)}`),
    ),
  ).buffer,
);
```

## Exports

- `fonts`: every font in the package. Each has its display `name`, its
  `folder` in `subsets/`, the `family` name inside the subset files, the
  `source` font it was made from, its `license`, and the `licenseFile` that
  holds the licence's text.
- `getFont(folder)`: the font in `subsets/<folder>/`, or `undefined`.
- `subsetPath(folder, group, format = 'otf')`: a subset file's path inside the
  package, such as `subsets/stix-two-math/base.otf`.
- `formats`: `['otf', 'woff']`.
- Types: `MathFont`, `FontFormat`, `FontLicense`.

## Licences

The JavaScript is MIT-licensed. The fonts keep their original licences:
STIX Two Math is under the SIL Open Font License 1.1, and Latin Modern Math
and the TeX Gyre fonts are under the GUST Font License. See
[LICENSE.md](LICENSE.md) for details and copyright notices.

## Updating the subsets

The subsets are built from the fonts in the repository's `assets/` folder by
`scripts/subset-fonts.py`, using the list in `src/fonts.json`. To add a font,
add an entry there, put its source file in `assets/`, and run
`python3 scripts/subset-fonts.py`.
