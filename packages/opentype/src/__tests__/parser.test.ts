import path from 'path';
import fs from 'fs';
import { Blob } from 'buffer';

import type { Font, TableDirectory } from '../types';

import { parse, parseDirectory } from '../parser';
import { describeCharacter } from '../test-util';
import { getGlyphMetrics } from '../util';

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
          {
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

describe('parse latinmodern-math.otf', () => {
  let font: Font;

  beforeAll(async () => {
    const fontPath = path.join(
      __dirname,
      '../../../../assets/latinmodern-math.otf',
    );
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    font = await parse(blob);
  });

  test('FontBBox with a negative int16 operand', () => {
    // Latin Modern encodes the FontBBox yMin, -3060, as an int16 (operand 28).
    expect(font.cff.topDict.FontBBox).toEqual([-1042, -3060, 4082, 3560]);
  });
});

describe('parse from an ArrayBuffer', () => {
  test('reads the same font as from a Blob', async () => {
    const file = fs.readFileSync(
      path.join(__dirname, '../../../../assets/STIX2Math.otf'),
    );
    const arrayBuffer = new ArrayBuffer(file.byteLength);
    new Uint8Array(arrayBuffer).set(file);

    const fromBlob = await parse(new Blob([file]));
    const fromBuffer = await parse(arrayBuffer);

    expect(fromBuffer.head).toEqual(fromBlob.head);
    expect(fromBuffer.cff).toEqual(fromBlob.cff);
    expect(fromBuffer.math.constants).toEqual(fromBlob.math.constants);
    // Characters from each table: plain letters, a delimiter with size
    // variants and an assembly, and an accent.
    for (const char of ['x', 'A', '(', '∫', '̂']) {
      expect(describeCharacter(fromBuffer, char.codePointAt(0) ?? 0)).toEqual(
        describeCharacter(fromBlob, char.codePointAt(0) ?? 0),
      );
    }
  });
});

describe('getGlyphMetrics', () => {
  let font: Font;

  beforeAll(async () => {
    const file = fs.readFileSync(
      path.join(__dirname, '../../../../assets/STIX2Math.otf'),
    );
    font = await parse(new Blob([file]));
  });

  test('works out the metrics from the glyph outline', () => {
    for (const char of ['x', 'H', '(', '∫', ' ']) {
      const gid = font.getGlyphID(char);
      expect(font.getGlyphMetrics(gid)).toEqual(
        getGlyphMetrics(font.getGlyph(gid)),
      );
    }
  });

  test('works them out once per glyph', () => {
    const x = font.getGlyphID('x');
    const metrics = font.getGlyphMetrics(x);
    expect(font.getGlyphMetrics(x)).toBe(metrics);
    expect(font.getGlyphMetrics(font.getGlyphID('y'))).not.toBe(metrics);
  });
});
