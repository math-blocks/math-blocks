// Helpers shared by the font subset tests. See
// https://github.com/math-blocks/math-blocks/issues/696.
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

import { parse } from './parser';
import type { Font, GlyphMetrics } from './types';
import type { Path } from './tables/cff-types';
import type { GlyphConstruction } from './tables/math-types';

export const ASSETS = path.join(__dirname, '../../../assets');

// Keep in sync with FONTS in scripts/subset-fonts.py.
export const FONTS: readonly {
  readonly source: string;
  readonly subset: string;
}[] = [
  { source: 'STIX2Math.otf', subset: 'stix-two-math' },
  { source: 'latinmodern-math.otf', subset: 'latin-modern-math' },
  { source: 'texgyrebonum-math.otf', subset: 'tex-gyre-bonum-math' },
  { source: 'texgyrepagella-math.otf', subset: 'tex-gyre-pagella-math' },
  { source: 'texgyreschola-math.otf', subset: 'tex-gyre-schola-math' },
  { source: 'texgyretermes-math.otf', subset: 'tex-gyre-termes-math' },
];

/** Parses a font file, given its path relative to assets/. */
export const loadFont = async (
  ...segments: readonly string[]
): Promise<Font> => {
  const buffer = fs.readFileSync(path.join(ASSETS, ...segments));
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
