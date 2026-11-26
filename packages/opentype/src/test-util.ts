// Helpers shared by the font subset tests. See
// https://github.com/math-blocks/math-blocks/issues/696.
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

import { fonts } from '@math-blocks/fonts';

import { parse } from './parser';
import type { Font, GlyphMetrics } from './types';
import type { Path } from './tables/cff-types';
import type { GlyphConstruction } from './tables/math-types';

/** The source fonts. */
export const ASSETS = path.join(__dirname, '../../../assets');

/** The font subsets, which @math-blocks/fonts ships. */
export const SUBSETS = path.join(__dirname, '../../fonts/subsets');

// Each font's source file in assets/ and its folder in SUBSETS, from the
// list of fonts in @math-blocks/fonts.
export const FONTS: readonly {
  readonly source: string;
  readonly subset: string;
}[] = fonts.map((font) => ({ source: font.source, subset: font.folder }));

/** Parses a font file, given its path relative to assets/. */
export const loadFont = async (
  ...segments: readonly string[]
): Promise<Font> => {
  const buffer = fs.readFileSync(path.join(ASSETS, ...segments));
  return parse(new Blob([buffer]));
};

/** Parses a subset file, given its font's folder and file name. */
export const loadSubset = async (
  subset: string,
  file: string,
): Promise<Font> => {
  const buffer = fs.readFileSync(path.join(SUBSETS, subset, file));
  return parse(new Blob([buffer]));
};

export const hex = (codePoint: number): string =>
  'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');

/** Returns the glyph ID for a code point, or null if the font can't map it. */
export const getGlyphID = (font: Font, codePoint: number): number | null => {
  try {
    return font.getGlyphID(String.fromCodePoint(codePoint));
  } catch {
    return null;
  }
};

/** Everything the typesetter can read about a glyph, without its ID. */
export type GlyphDescription = {
  readonly path: Path;
  readonly metrics: GlyphMetrics;
  readonly italicCorrection: number | undefined;
  readonly isExtendedShape: boolean;
};

export type ConstructionDescription = {
  readonly variants: readonly {
    readonly glyph: GlyphDescription;
    readonly advanceMeasurement: number;
  }[];
  readonly assembly: {
    readonly italicsCorrection: number;
    readonly parts: readonly {
      readonly glyph: GlyphDescription;
      readonly startConnectorLength: number;
      readonly endConnectorLength: number;
      readonly fullAdvance: number;
      readonly partsFlags: number;
    }[];
  } | null;
} | null;

export type CharacterDescription = {
  readonly codePoint: string;
  readonly glyph: GlyphDescription;
  readonly vertical: ConstructionDescription;
  readonly horizontal: ConstructionDescription;
};

export const describeGlyph = (
  font: Font,
  glyphID: number,
): GlyphDescription => ({
  path: font.getGlyph(glyphID).path,
  metrics: font.getGlyphMetrics(glyphID),
  // Only the value: the device table offset changes when the table shrinks.
  italicCorrection: font.math.glyphInfo.getItalicCorrection(glyphID)?.value,
  isExtendedShape: font.math.glyphInfo.isExtendedShape(glyphID),
});

const describeConstruction = (
  font: Font,
  construction: GlyphConstruction | null,
): ConstructionDescription => {
  if (!construction) {
    return null;
  }
  const { glyphAssembly, mathGlyphVariantRecords } = construction;
  return {
    variants: mathGlyphVariantRecords.map((record) => ({
      glyph: describeGlyph(font, record.variantGlyph),
      advanceMeasurement: record.advanceMeasurement,
    })),
    assembly: glyphAssembly && {
      italicsCorrection: glyphAssembly.italicsCorrection.value,
      parts: glyphAssembly.partRecords.map((part) => ({
        glyph: describeGlyph(font, part.glyphID),
        startConnectorLength: part.startConnectorLength,
        endConnectorLength: part.endConnectorLength,
        fullAdvance: part.fullAdvance,
        partsFlags: part.partsFlags,
      })),
    },
  };
};

/**
 * Describes everything the typesetter can read about a character in a font,
 * following glyph IDs to what they contain, so that the same character can be
 * compared across fonts that number their glyphs differently. The code point
 * is included so that a failure names the character.
 */
export const describeCharacter = (
  font: Font,
  codePoint: number,
): CharacterDescription => {
  const glyphID = font.getGlyphID(String.fromCodePoint(codePoint));
  return {
    codePoint: hex(codePoint),
    glyph: describeGlyph(font, glyphID),
    vertical: describeConstruction(
      font,
      font.math.variants.getVertGlyphConstruction(glyphID),
    ),
    horizontal: describeConstruction(
      font,
      font.math.variants.getHorizGlyphConstruction(glyphID),
    ),
  };
};
