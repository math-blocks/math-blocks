import data from './fonts.json';

/**
 * The licence a font is distributed under. Each one's text is in this
 * package's `licenses/` folder:
 *
 * - `'OFL-1.1'`: the SIL Open Font License 1.1 (`licenses/OFL-1.1.txt`).
 * - `'GUST-Font-License'`: the GUST Font License
 *   (`licenses/GUST-FONT-LICENSE.txt`), which is the LaTeX Project Public
 *   License 1.3c (`licenses/LPPL-1.3c.txt`) plus a request to rename modified
 *   versions.
 */
export type FontLicense = 'OFL-1.1' | 'GUST-Font-License';

/** A math font whose subsets this package ships. */
export type MathFont = {
  /** The name of the font the subsets were made from, e.g. "STIX Two Math". */
  readonly name: string;
  /**
   * The folder in `subsets/` that holds this font's subset files, e.g.
   * "stix-two-math".
   */
  readonly folder: string;
  /**
   * The family name inside the subset files, e.g. "MathBlocks Math A". The
   * subsets are modified versions of the original font, so they're renamed,
   * as the fonts' licences require or ask.
   */
  readonly family: string;
  /**
   * The file name of the original font the subsets were made from, e.g.
   * "STIX2Math.otf". The original isn't included in this package.
   */
  readonly source: string;
  /** The licence the font, and so its subsets, are distributed under. */
  readonly license: FontLicense;
  /** The path of the licence's text inside this package. */
  readonly licenseFile: string;
};

const LICENSE_FILES: Record<FontLicense, string> = {
  'OFL-1.1': 'licenses/OFL-1.1.txt',
  'GUST-Font-License': 'licenses/GUST-FONT-LICENSE.txt',
};

const isLicense = (license: string): license is FontLicense =>
  Object.prototype.hasOwnProperty.call(LICENSE_FILES, license);

/**
 * Every font whose subsets this package ships. src/fonts.json is the one list
 * of fonts: scripts/subset-fonts.py builds the subsets from it, and the tests
 * and demo read it too.
 */
export const fonts: readonly MathFont[] = data.fonts.map((font) => {
  if (!isLicense(font.license)) {
    throw new Error(`Unknown licence for ${font.name}: ${font.license}`);
  }
  return {
    name: font.name,
    folder: font.folder,
    family: `MathBlocks Math ${font.letter}`,
    source: font.source,
    license: font.license,
    licenseFile: LICENSE_FILES[font.license],
  };
});

/** Returns the font whose subsets are in `subsets/<folder>/`, if any. */
export const getFont = (folder: string): MathFont | undefined =>
  fonts.find((font) => font.folder === folder);

/**
 * Returns the path of a subset file inside this package, such as
 * `subsets/stix-two-math/base.woff`. `group` is a glyph group's name from
 * `glyphGroups` in `@math-blocks/opentype`.
 *
 * The subsets are WOFF 1.0 files, which `@math-blocks/opentype` reads
 * wherever `DecompressionStream` is available (current browsers and Node 18+).
 *
 * Resolve the path against the installed package, e.g. with
 * `require.resolve(`@math-blocks/fonts/${subsetPath(...)}`)` in Node, or copy
 * the package's `subsets/` folder to a static host and load it with
 * `fromBaseUrl`.
 */
export const subsetPath = (folder: string, group: string): string => {
  if (!getFont(folder)) {
    throw new Error(`Unknown font folder: "${folder}"`);
  }
  return `subsets/${folder}/${group}.woff`;
};
