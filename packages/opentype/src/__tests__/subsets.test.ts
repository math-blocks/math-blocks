// Checks that each font subset in @math-blocks/fonts renders its characters
// exactly like the original font: same outlines, metrics and MATH data. Glyph
// IDs differ between a subset and its original, so glyphs are compared by
// what they contain rather than by ID. See
// https://github.com/math-blocks/math-blocks/issues/696.
import { glyphGroups } from '../glyph-groups';
import {
  FONTS,
  describeCharacter,
  getGlyphID,
  hex,
  loadFont,
  loadSubset,
} from '../test-util';
import type { Font } from '../types';

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
      font = await loadSubset(subset, `${group.name}.otf`);
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
        if (
          getGlyphID(original, codePoint) === null ||
          getGlyphID(font, codePoint) === null
        ) {
          continue; // reported by the previous test
        }
        expect(describeCharacter(font, codePoint)).toEqual(
          describeCharacter(original, codePoint),
        );
      }
    });
  });
});
