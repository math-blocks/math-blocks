// Checks that each font subset in assets/subsets/ renders its characters
// exactly like the original font: same outlines, metrics and MATH data. Glyph
// IDs differ between a subset and its original, so glyphs are compared by
// what they contain rather than by ID. See
// https://github.com/math-blocks/math-blocks/issues/696.
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

import { parse } from '../parser';
import { glyphGroups } from '../glyph-groups';
import type { Font, GlyphMetrics } from '../types';
import type { Path } from '../tables/cff-types';
import type { GlyphConstruction } from '../tables/math-types';

const ASSETS = path.join(__dirname, '../../../../assets');

// Keep in sync with FONTS in scripts/subset-fonts.py.
const FONTS: readonly { readonly source: string; readonly subset: string }[] = [
  { source: 'STIX2Math.otf', subset: 'mathblocks-math-a' },
  { source: 'latinmodern-math.otf', subset: 'mathblocks-math-b' },
  { source: 'texgyrebonum-math.otf', subset: 'mathblocks-math-c' },
  { source: 'texgyrepagella-math.otf', subset: 'mathblocks-math-d' },
  { source: 'texgyreschola-math.otf', subset: 'mathblocks-math-e' },
  { source: 'texgyretermes-math.otf', subset: 'mathblocks-math-f' },
];

// Everything the typesetter can read about a glyph, without its ID.
type GlyphDescription = {
  readonly path: Path;
  readonly metrics: GlyphMetrics;
  readonly italicCorrection: number | undefined;
  readonly isExtendedShape: boolean;
};

type ConstructionDescription = {
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

type CharacterDescription = {
  readonly codePoint: string;
  readonly glyph: GlyphDescription;
  readonly vertical: ConstructionDescription;
  readonly horizontal: ConstructionDescription;
};

const loadFont = async (...segments: readonly string[]): Promise<Font> => {
  const buffer = fs.readFileSync(path.join(ASSETS, ...segments));
  return parse(new Blob([buffer]));
};

const hex = (codePoint: number): string =>
  'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');

// Returns the glyph ID for a code point, or null if the font doesn't map it.
const getGlyphID = (font: Font, codePoint: number): number | null => {
  try {
    return font.getGlyphID(String.fromCodePoint(codePoint));
  } catch {
    return null;
  }
};

const describeGlyph = (font: Font, glyphID: number): GlyphDescription => ({
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

// The code point is included so that a failure names the character.
const describeCharacter = (
  font: Font,
  codePoint: number,
  glyphID: number,
): CharacterDescription => ({
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
});

describe('glyph groups', () => {
  test('no code point is in more than one group', () => {
    const owner = new Map<number, string>();
    const duplicates: string[] = [];
    for (const group of glyphGroups) {
      for (const codePoint of group.codePoints) {
        const other = owner.get(codePoint);
        if (other) {
          duplicates.push(`${hex(codePoint)} (${other}, ${group.name})`);
        }
        owner.set(codePoint, group.name);
      }
    }
    expect(duplicates).toEqual([]);
  });
});

describe.each(FONTS)('$subset (subset of $source)', ({ source, subset }) => {
  let original: Font;

  beforeAll(async () => {
    original = await loadFont(source);
  });

  describe.each(glyphGroups)('$name', (group) => {
    let font: Font;

    beforeAll(async () => {
      font = await loadFont('subsets', subset, `${group.name}.otf`);
    });

    test('has the same MATH constants as the original', () => {
      expect(font.head.unitsPerEm).toEqual(original.head.unitsPerEm);
      expect(font.math.constants).toEqual(original.math.constants);
      expect(font.math.variants.minConnectorOverlap).toEqual(
        original.math.variants.minConnectorOverlap,
      );
    });

    test('contains every character of the group that the original has', () => {
      const missing = group.codePoints
        .filter((cp) => getGlyphID(original, cp) !== null)
        .filter((cp) => getGlyphID(font, cp) === null)
        .map(hex);
      expect(missing).toEqual([]);
    });

    test('draws each character exactly like the original', () => {
      for (const codePoint of group.codePoints) {
        const originalID = getGlyphID(original, codePoint);
        const subsetID = getGlyphID(font, codePoint);
        if (originalID === null || subsetID === null) {
          continue; // reported by the previous test
        }
        expect(describeCharacter(font, codePoint, subsetID)).toEqual(
          describeCharacter(original, codePoint, originalID),
        );
      }
    });
  });
});
