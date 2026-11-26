import { combineFonts } from '../combined-font';
import { GlyphGroupNotLoadedError } from '../errors';
import type { CombinedFont } from '../combined-font';
import { glyphGroups, glyphGroupsForText } from '../glyph-groups';
import {
  FONTS,
  describeCharacter,
  getGlyphID,
  hex,
  loadFont,
  loadSubset as loadSubsetFile,
} from '../test-util';
import type { Font } from '../types';

const loadSubset = (subset: string, group: string): Promise<Font> =>
  loadSubsetFile(subset, `${group}.otf`);

describe('combineFonts', () => {
  let base: Font;
  let calculus: Font;
  let font: CombinedFont;

  beforeAll(async () => {
    base = await loadSubset('stix-two-math', 'base');
    calculus = await loadSubset('stix-two-math', 'calculus');
    font = combineFonts({ base });
  });

  test('needs the base group', () => {
    expect(() => combineFonts({ calculus })).toThrow(
      'combineFonts needs the "base" glyph group',
    );
  });

  test('maps characters in the base group', () => {
    expect(font.loadedGroups).toEqual(['base']);
    expect(font.getGlyphID('x')).toEqual(base.getGlyphID('x'));
    expect(font.getGlyph(font.getGlyphID('x'))).toBe(
      base.getGlyph(base.getGlyphID('x')),
    );
  });

  test('throws GlyphGroupNotLoadedError for a group that is not loaded', () => {
    let error: unknown;
    try {
      font.getGlyphID('∫');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(GlyphGroupNotLoadedError);
    expect(error).toMatchObject({ group: 'calculus', codePoint: 0x222b });
    expect((error as Error).message).toEqual(
      'U+222B is in the "calculus" glyph group, which hasn\'t been loaded',
    );
  });

  test('throws the usual error for a character in no group', () => {
    expect(() => font.getGlyphID('😀')).toThrow(
      'No glyphID in font for given codePoint: 128512',
    );
  });

  test('withGroup returns a new font and leaves the old one unchanged', () => {
    const font2 = font.withGroup('calculus', calculus);
    expect(font2.loadedGroups).toEqual(['base', 'calculus']);
    expect(() => font2.getGlyphID('∫')).not.toThrow();
    expect(font.loadedGroups).toEqual(['base']);
    expect(() => font.getGlyphID('∫')).toThrow(GlyphGroupNotLoadedError);
  });

  test("gives each group a fixed slot, so IDs don't depend on load order", async () => {
    const calculusSlot = glyphGroups.findIndex((g) => g.name === 'calculus');
    const font2 = font.withGroup('calculus', calculus);
    const intID = font2.getGlyphID('∫');
    expect(intID).toEqual(calculusSlot * 0x10000 + calculus.getGlyphID('∫'));

    // Loading another group first, or afterwards, doesn't change the IDs.
    const trig = await loadSubset('stix-two-math', 'trig-geometry');
    const trigFirst = font.withGroup('trig-geometry', trig);
    expect(trigFirst.withGroup('calculus', calculus).getGlyphID('∫')).toEqual(
      intID,
    );
    expect(font2.withGroup('trig-geometry', trig).getGlyphID('∫')).toEqual(
      intID,
    );
    expect(font2.getGlyphID('x')).toEqual(font.getGlyphID('x'));
  });

  test('translates size variant and assembly glyph IDs into the same slot', () => {
    const font2 = font.withGroup('calculus', calculus);
    const intID = font2.getGlyphID('∫');
    const slot = Math.floor(intID / 0x10000);
    const construction = font2.math.variants.getVertGlyphConstruction(intID);
    const original = calculus.math.variants.getVertGlyphConstruction(
      calculus.getGlyphID('∫'),
    );
    expect(
      construction?.mathGlyphVariantRecords.map((r) => r.variantGlyph),
    ).toEqual(
      original?.mathGlyphVariantRecords.map(
        (r) => r.variantGlyph + slot * 0x10000,
      ),
    );
    // Memoized, like a single font's constructions.
    expect(font2.math.variants.getVertGlyphConstruction(intID)).toBe(
      construction,
    );
  });

  test('throws when given a glyph ID from a group that is not loaded', () => {
    const font2 = font.withGroup('calculus', calculus);
    const intID = font2.getGlyphID('∫');
    expect(() => font.getGlyph(intID)).toThrow(
      'belongs to the "calculus" glyph group, which hasn\'t been loaded',
    );
  });

  test('rejects unknown groups and subsets of a different font', async () => {
    expect(() => font.withGroup('chemistry', calculus)).toThrow(
      'Unknown glyph group "chemistry"',
    );
    const otherCalculus = await loadSubset('latin-modern-math', 'calculus');
    expect(() => font.withGroup('calculus', otherCalculus)).toThrow(
      'Can\'t add "calculus" from "MathBlocks Math B" to a combined font made from "MathBlocks Math A"',
    );
  });
});

describe('glyphGroupsForText', () => {
  test('lists the groups a string needs, in glyphGroups order', () => {
    expect(glyphGroupsForText('3x + 2 = 11')).toEqual(['base']);
    expect(glyphGroupsForText('∫ sin θ dθ')).toEqual([
      'base',
      'trig-geometry',
      'calculus',
    ]);
    expect(glyphGroupsForText('x ∈ ℝ')).toEqual(['base', 'sets-logic']);
  });

  test('ignores characters that are in no group', () => {
    expect(glyphGroupsForText('😀')).toEqual([]);
  });
});

// Combining every subset of a font must give back the original font, for
// every character in every group.
describe.each(FONTS)(
  'all subsets of $source combined',
  ({ source, subset }) => {
    let original: Font;
    let combined: CombinedFont;

    beforeAll(async () => {
      original = await loadFont(source);
      const parts: Record<string, Font> = {};
      for (const group of glyphGroups) {
        parts[group.name] = await loadSubset(subset, group.name);
      }
      combined = combineFonts(parts);
    });

    test('loads every group', () => {
      expect(combined.loadedGroups).toEqual(glyphGroups.map((g) => g.name));
    });

    test('has the same MATH constants and units per em as the original', () => {
      expect(combined.head.unitsPerEm).toEqual(original.head.unitsPerEm);
      expect(combined.math.constants).toEqual(original.math.constants);
    });

    test.each(glyphGroups)(
      'draws every character of $name exactly like the original',
      (group) => {
        const codePoints = group.codePoints.filter(
          (cp) => getGlyphID(original, cp) !== null,
        );
        const missing = codePoints
          .filter((cp) => getGlyphID(combined, cp) === null)
          .map(hex);
        expect(missing).toEqual([]);
        for (const codePoint of codePoints) {
          expect(describeCharacter(combined, codePoint)).toEqual(
            describeCharacter(original, codePoint),
          );
        }
      },
    );
  },
);
