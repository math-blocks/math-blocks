import data from './fonts.json';
import { isFontFolder, toMathFont } from './font-list';
import type { FontFolder, MathFont } from './font-list';

export { FONT_FOLDERS, isFontFolder } from './font-list';
export type { FontFolder, FontLicense, MathFont } from './font-list';

/**
 * Every font whose subsets this package ships. src/fonts.json is the one list
 * of fonts: scripts/subset-fonts.py builds the subsets from it, and the tests
 * and demo read it too.
 */
export const fonts: readonly MathFont[] = data.fonts.map(toMathFont);

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
export const subsetPath = (folder: FontFolder, group: string): string => {
  // Also checked at runtime, for callers that aren't type-checked.
  if (!isFontFolder(folder)) {
    throw new Error(`Unknown font folder: "${String(folder)}"`);
  }
  return `subsets/${folder}/${group}.woff`;
};
