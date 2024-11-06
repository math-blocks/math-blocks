import path from 'path';
import fs from 'fs';
import { Blob } from 'buffer';

import type { Font, TableDirectory } from '../types';

import { parse, parseDirectory } from '../parser';

describe('parseDirectory', () => {
  let dir: TableDirectory;

  beforeAll(async () => {
    const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    dir = await parseDirectory(blob);
  });

  test('top-level properties', () => {
    expect(dir.sfntVersion).toEqual('OTTO');
    expect(dir.numTables).toEqual(13);
    expect(dir.searchRange).toEqual(128);
    expect(dir.entrySelector).toEqual(3);
    expect(dir.rangeShift).toEqual(80);
  });

  test('tableRecords', () => {
    expect(dir.tableRecords).toMatchSnapshot();
  });
});

describe('parse', () => {
  let font: Font;

  beforeAll(async () => {
    const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    font = await parse(blob);
  });

  describe('CFF ', () => {
    test('name', () => {
      expect(font.cff.name).toEqual('STIXTwoMath');
    });

    test('topDict', () => {
      expect(font.cff.topDict).toMatchSnapshot();
    });
  });

  describe('math', () => {
    describe('MathContants', () => {
      test('constants should have expected values', () => {
        expect(font.math.constants).toMatchSnapshot();
      });
    });

    describe('MathVariants', () => {
      test('top-level variants properties', async () => {
        expect(font.math.variants).toMatchInlineSnapshot(`
                    Object {
                      "getHorizGlyphConstruction": [Function],
                      "getVertGlyphConstruction": [Function],
                      "horizGlyphCount": 47,
                      "horizGlyphCoverageOffset": 992,
                      "minConnectorOverlap": 100,
                      "vertGlyphCount": 118,
                      "vertGlyphCoverageOffset": 340,
                    }
                `);
      });

      test('vertical glyph construction for parenleft', () => {
        const gid = font.getGlyphID('(');

        const glyphConstruction =
          font.math.variants.getVertGlyphConstruction(gid);

        expect(glyphConstruction).toMatchSnapshot();
      });

      test('getVertGlyphConstruction is memoized', () => {
        const gid = font.getGlyphID('(');

        const construction1 = font.math.variants.getVertGlyphConstruction(gid);
        const construction2 = font.math.variants.getVertGlyphConstruction(gid);

        expect(construction1).toBe(construction2);
      });

      test('horizontal glyph construction for uni0303 (combining tilde)', () => {
        const gid = font.getGlyphID('\u0303');

        const glyphConstruction =
          font.math.variants.getHorizGlyphConstruction(gid);

        expect(glyphConstruction).toMatchSnapshot();
      });

      test('getHorizGlyphConstruction is memoized', () => {
        const gid = font.getGlyphID('\u0303');

        const construction1 = font.math.variants.getHorizGlyphConstruction(gid);
        const construction2 = font.math.variants.getHorizGlyphConstruction(gid);

        expect(construction1).toBe(construction2);
      });
    });

    describe('MathGlyphInfo', () => {
      test("')' should be an extended glyph", () => {
        const gid = font.getGlyphID(')');

        expect(font.math.glyphInfo.isExtendedShape(gid)).toBe(true);
      });

      test("'+' should not be an extended glyph", () => {
        const gid = font.getGlyphID('+');

        expect(font.math.glyphInfo.isExtendedShape(gid)).toBe(false);
      });
    });
  });

  describe('glyphs', () => {
    test('name', () => {
      const gid = font.getGlyphID('(');
      const glyph = font.getGlyph(gid);

      expect(glyph.name).toEqual('parenleft');
    });

    test('getGlyph is memoized', () => {
      const gid = font.getGlyphID('(');
      const glyph1 = font.getGlyph(gid);
      const glyph2 = font.getGlyph(gid);

      expect(glyph1).toBe(glyph2);
    });

    test('metrics', () => {
      const gid = font.getGlyphID('(');
      const glyph = font.getGlyph(gid);

      expect(glyph.metrics).toEqual({
        advance: 357,
      });
    });

    test('getGlyphMetrics', () => {
      const gid = font.getGlyphID('(');
      const glyphMetrics = font.getGlyphMetrics(gid);

      expect(glyphMetrics).toEqual({
        advance: 357,
        bearingX: 45,
        bearingY: 736,
        height: 932,
        width: 282,
      });
    });

    test("metrics and glyphMetrics 'advance' match", () => {
      const gid = font.getGlyphID('(');
      const glyphMetrics = font.getGlyphMetrics(gid);
      const glyph = font.getGlyph(gid);

      expect(glyphMetrics.advance).toEqual(glyph.metrics.advance);
    });

    test('path', () => {
      const gid = font.getGlyphID('(');
      const glyph = font.getGlyph(gid);

      expect(glyph.path).toEqual([
        { type: 'M', x: 45, y: 270 },
        { type: 'C', x: 311, x1: 45, x2: 150, y: -196, y1: 47, y2: -112 },
        { type: 'L', x: 327, y: -170 },
        { type: 'C', x: 127, x1: 181, x2: 127, y: 270, y1: -71, y2: 66 },
        { type: 'C', x: 327, x1: 127, x2: 181, y: 710, y1: 474, y2: 611 },
        { type: 'L', x: 311, y: 736 },
        { type: 'C', x: 45, x1: 150, x2: 45, y: 270, y1: 652, y2: 493 },
        { type: 'Z' },
      ]);
    });
  });
});
