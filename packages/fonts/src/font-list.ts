// The types and checks behind the list of fonts. index.ts builds `fonts` from
// fonts.json with toMathFont, which tests also call with malformed entries.
import { FONT_FOLDERS } from './fonts.generated';

export { FONT_FOLDERS };

/**
 * The folder in `subsets/` of a font this package ships, such as
 * "stix-two-math". It comes from fonts.generated.ts, which
 * scripts/subset-fonts.py writes from fonts.json: TypeScript widens strings
 * imported from JSON to `string`, so fonts.json alone can't give this type.
 */
export type FontFolder = (typeof FONT_FOLDERS)[number];

/** Returns true if `folder` is the folder of a font this package ships. */
export const isFontFolder = (folder: string): folder is FontFolder =>
  (FONT_FOLDERS as readonly string[]).includes(folder);

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
  readonly folder: FontFolder;
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

/** An entry in fonts.json, as TypeScript reads it. */
export type FontEntry = {
  readonly name: string;
  readonly folder: string;
  readonly source: string;
  readonly letter: string;
  readonly license: string;
};

/**
 * Turns an entry in fonts.json into a MathFont, checking its licence and
 * folder, since TypeScript reads both from the JSON as plain strings.
 */
export const toMathFont = (font: FontEntry): MathFont => {
  if (!isLicense(font.license)) {
    throw new Error(`Unknown licence for ${font.name}: ${font.license}`);
  }
  if (!isFontFolder(font.folder)) {
    // fonts.generated.ts is stale.
    throw new Error(
      `${font.folder} isn't in fonts.generated.ts; run scripts/subset-fonts.py`,
    );
  }
  return {
    name: font.name,
    folder: font.folder,
    family: `MathBlocks Math ${font.letter}`,
    source: font.source,
    license: font.license,
    licenseFile: LICENSE_FILES[font.license],
  };
};
