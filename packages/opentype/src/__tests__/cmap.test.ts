import path from 'path';
import fs from 'fs';
import { Blob } from 'buffer';

import { parseCmap } from '../tables/cmap';
import { parse, parseDirectory } from '../parser';

type Segment = {
  readonly startCode: number;
  readonly endCode: number;
  readonly idDelta: number;
  // When set, the segment's glyph IDs come from glyphIdArray[] instead of
  // code + idDelta.
  readonly glyphIds?: readonly number[];
  // Overrides the idRangeOffset the builder works out, to make a malformed
  // subtable.
  readonly idRangeOffset?: number;
};

// Builds the bytes of a format 4 subtable.
const buildFormat4Subtable = (segments: readonly Segment[]): ArrayBuffer => {
  const segCount = segments.length;
  const glyphIdArray: number[] = [];
  const idRangeOffsets: number[] = segments.map((segment, i) => {
    let offset = 0;
    if (segment.glyphIds) {
      // Byte offset from idRangeOffset[i] to the segment's first entry in
      // glyphIdArray[], which starts right after idRangeOffset[].
      offset = (segCount - i + glyphIdArray.length) * 2;
      glyphIdArray.push(...segment.glyphIds);
    }
    return segment.idRangeOffset ?? offset;
  });

  const length = 16 + segCount * 8 + glyphIdArray.length * 2;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  let pos = 0;
  const write16 = (value: number): void => {
    view.setUint16(pos, value & 0xffff);
    pos += 2;
  };

  write16(4); // format
  write16(length); // length
  write16(0); // language
  write16(segCount * 2); // segCountX2
  write16(0); // searchRange (unused by the parser)
  write16(0); // entrySelector (unused by the parser)
  write16(0); // rangeShift (unused by the parser)
  segments.forEach((s) => write16(s.endCode));
  write16(0); // reservedPad
  segments.forEach((s) => write16(s.startCode));
  segments.forEach((s) => write16(s.idDelta));
  idRangeOffsets.forEach(write16);
  glyphIdArray.forEach(write16);

  return buffer;
};

type Group = {
  readonly startCharCode: number;
  readonly endCharCode: number;
  readonly glyphID: number;
};

// Builds the bytes of a format 12 or format 13 subtable. They share a layout
// and only differ in how a group's glyphID is applied.
const buildGroupSubtable = (
  format: 12 | 13,
  groups: readonly Group[],
): ArrayBuffer => {
  const length = 16 + groups.length * 12;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  view.setUint16(0, format);
  view.setUint16(2, 0); // reserved
  view.setUint32(4, length);
  view.setUint32(8, 0); // language
  view.setUint32(12, groups.length);
  groups.forEach((group, i) => {
    view.setUint32(16 + i * 12, group.startCharCode);
    view.setUint32(16 + i * 12 + 4, group.endCharCode);
    view.setUint32(16 + i * 12 + 8, group.glyphID);
  });

  return buffer;
};

// The start of a subtable in a format the parser doesn't read. The parser
// only looks at the format field before giving up on it.
const buildUnsupportedSubtable = (format: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint16(0, format);
  return buffer;
};

type SubtableRecord = {
  readonly platformID: number;
  readonly encodingID: number;
  readonly subtable: ArrayBuffer;
};

// Builds a cmap table from encoding records and their subtables.
const buildCmap = (records: readonly SubtableRecord[]): Blob => {
  const headerLength = 4 + records.length * 8;
  const totalLength = records.reduce(
    (sum, record) => sum + record.subtable.byteLength,
    headerLength,
  );
  const bytes = new Uint8Array(totalLength);
  const view = new DataView(bytes.buffer);

  view.setUint16(0, 0); // version
  view.setUint16(2, records.length); // numTables

  let subtableOffset = headerLength;
  records.forEach((record, i) => {
    view.setUint16(4 + i * 8, record.platformID);
    view.setUint16(4 + i * 8 + 2, record.encodingID);
    view.setUint32(4 + i * 8 + 4, subtableOffset);
    bytes.set(new Uint8Array(record.subtable), subtableOffset);
    subtableOffset += record.subtable.byteLength;
  });

  return new Blob([bytes]);
};

// Builds a cmap table with a single (3, 1) format 4 subtable.
const buildFormat4Cmap = (segments: readonly Segment[]): Blob =>
  buildCmap([
    { platformID: 3, encodingID: 1, subtable: buildFormat4Subtable(segments) },
  ]);

const SENTINEL: Segment = { startCode: 0xffff, endCode: 0xffff, idDelta: 1 };

describe('parseCmap', () => {
  describe('format 4', () => {
    test('idRangeOffset == 0 uses code + idDelta', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0x41, endCode: 0x43, idDelta: 10 - 0x41 },
        SENTINEL,
      ]);

      expect(await parseCmap(blob)).toEqual({ 0x41: 10, 0x42: 11, 0x43: 12 });
    });

    test('idDelta wraps around modulo 65536', async () => {
      const blob = buildFormat4Cmap([
        // 0xf000 + 0x1003 = 0x10003, which wraps to 3.
        { startCode: 0xf000, endCode: 0xf001, idDelta: 0x1003 },
        // 0x20 - 0x1e = 2, written as the uint16 0xffe2.
        { startCode: 0x20, endCode: 0x20, idDelta: -0x1e },
        SENTINEL,
      ]);

      expect(await parseCmap(blob)).toEqual({ 0xf000: 3, 0xf001: 4, 0x20: 2 });
    });

    test('idRangeOffset != 0 indexes into glyphIdArray', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0x41, endCode: 0x42, idDelta: 0, glyphIds: [7, 8] },
        // A 0 in glyphIdArray means there's no glyph for 0x62.
        { startCode: 0x61, endCode: 0x63, idDelta: 0, glyphIds: [20, 0, 22] },
        // idDelta is added to non-zero entries from glyphIdArray.
        { startCode: 0x100, endCode: 0x101, idDelta: 5, glyphIds: [1, 2] },
        SENTINEL,
      ]);

      expect(await parseCmap(blob)).toEqual({
        0x41: 7,
        0x42: 8,
        0x61: 20,
        0x63: 22,
        0x100: 6,
        0x101: 7,
      });
    });

    test('mixes both kinds of segment', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0x30, endCode: 0x31, idDelta: 0, glyphIds: [3, 4] },
        { startCode: 0x41, endCode: 0x42, idDelta: 100 - 0x41 },
        { startCode: 0x61, endCode: 0x61, idDelta: 0, glyphIds: [9] },
        SENTINEL,
      ]);

      expect(await parseCmap(blob)).toEqual({
        0x30: 3,
        0x31: 4,
        0x41: 100,
        0x42: 101,
        0x61: 9,
      });
    });
  });

  describe('format 4 edge cases', () => {
    test('skips 0xFFFF when it ends a longer segment', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0xfffd, endCode: 0xffff, idDelta: 5 - 0xfffd },
      ]);

      expect(await parseCmap(blob)).toEqual({ 0xfffd: 5, 0xfffe: 6 });
    });

    test('throws a named error when idRangeOffset points past glyphIdArray', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0x41, endCode: 0x42, idDelta: 0, idRangeOffset: 0x1000 },
        SENTINEL,
      ]);

      await expect(parseCmap(blob)).rejects.toThrow(
        'Malformed cmap format 4 subtable: segment 0 (U+0041..U+0042) ' +
          'reads past the end of glyphIdArray',
      );
    });
  });

  describe('formats 12 and 13', () => {
    const groups: readonly Group[] = [
      { startCharCode: 0x41, endCharCode: 0x43, glyphID: 10 },
      { startCharCode: 0x1d400, endCharCode: 0x1d401, glyphID: 20 },
    ];

    test('format 12 maps each group to consecutive glyphs', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildGroupSubtable(12, groups),
        },
      ]);

      expect(await parseCmap(blob)).toEqual({
        0x41: 10,
        0x42: 11,
        0x43: 12,
        0x1d400: 20,
        0x1d401: 21,
      });
    });

    test.each([
      [3, 10],
      [0, 6],
    ])(
      'format 13 maps each group to one glyph in (%i, %i)',
      async (platformID, encodingID) => {
        const blob = buildCmap([
          {
            platformID,
            encodingID,
            subtable: buildGroupSubtable(13, groups),
          },
        ]);

        expect(await parseCmap(blob)).toEqual({
          0x41: 10,
          0x42: 10,
          0x43: 10,
          0x1d400: 20,
          0x1d401: 20,
        });
      },
    );
  });

  describe('malformed groups in formats 12 and 13', () => {
    const cmapWith = (format: 12 | 13, group: Group): Blob =>
      buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildGroupSubtable(format, [
            { startCharCode: 0x41, endCharCode: 0x41, glyphID: 1 },
            group,
          ]),
        },
      ]);

    // Before the range check, this group made parseCmap loop over about
    // four billion code points.
    test('throws on a group that goes past U+10FFFF', async () => {
      const blob = cmapWith(13, {
        startCharCode: 0x42,
        endCharCode: 0xffffffff,
        glyphID: 2,
      });

      await expect(parseCmap(blob)).rejects.toThrow(
        'Malformed cmap format 13 subtable: group 1 (U+0042..U+FFFFFFFF) ' +
          'goes past U+10FFFF',
      );
    });

    test('throws on a group that ends before it starts', async () => {
      const blob = cmapWith(12, {
        startCharCode: 0x50,
        endCharCode: 0x4f,
        glyphID: 2,
      });

      await expect(parseCmap(blob)).rejects.toThrow(
        'Malformed cmap format 12 subtable: group 1 (U+0050..U+004F) ' +
          'ends before it starts',
      );
    });

    test('accepts a group that ends at U+10FFFF', async () => {
      const blob = cmapWith(12, {
        startCharCode: 0x10fffe,
        endCharCode: 0x10ffff,
        glyphID: 2,
      });

      expect(await parseCmap(blob)).toEqual({
        0x41: 1,
        0x10fffe: 2,
        0x10ffff: 3,
      });
    });
  });

  describe('choosing a subtable', () => {
    // Each record maps 'A' to a different glyph, so the result shows which
    // record parseCmap read.
    const records: readonly SubtableRecord[] = [
      {
        platformID: 3,
        encodingID: 10,
        subtable: buildGroupSubtable(12, [
          { startCharCode: 0x41, endCharCode: 0x41, glyphID: 1 },
        ]),
      },
      {
        platformID: 0,
        encodingID: 4,
        subtable: buildGroupSubtable(12, [
          { startCharCode: 0x41, endCharCode: 0x41, glyphID: 2 },
        ]),
      },
      {
        platformID: 0,
        encodingID: 6,
        subtable: buildGroupSubtable(13, [
          { startCharCode: 0x41, endCharCode: 0x41, glyphID: 3 },
        ]),
      },
      {
        platformID: 3,
        encodingID: 1,
        subtable: buildFormat4Subtable([
          { startCode: 0x41, endCode: 0x41, idDelta: 4 - 0x41 },
          SENTINEL,
        ]),
      },
      {
        platformID: 0,
        encodingID: 3,
        subtable: buildFormat4Subtable([
          { startCode: 0x41, endCode: 0x41, idDelta: 5 - 0x41 },
          SENTINEL,
        ]),
      },
    ];

    test.each([
      [1, '(3, 10)'],
      [2, '(0, 4)'],
      [3, '(0, 6)'],
      [4, '(3, 1)'],
      [5, '(0, 3)'],
    ])(
      'reads glyph %i from %s when no more preferred record is present',
      async (glyphID) => {
        // Leave out every record before the expected one, and reverse the
        // rest so that the order of the records in the table doesn't matter.
        const blob = buildCmap(records.slice(glyphID - 1).reverse());

        expect(await parseCmap(blob)).toEqual({ 0x41: glyphID });
      },
    );

    test('skips records in unsupported formats', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildUnsupportedSubtable(8),
        },
        {
          platformID: 0,
          encodingID: 4,
          subtable: buildUnsupportedSubtable(10),
        },
        records[4],
      ]);

      expect(await parseCmap(blob)).toEqual({ 0x41: 5 });
    });

    test('ignores non-Unicode records', async () => {
      const blob = buildCmap([
        // Macintosh Roman, in a format we can read.
        { platformID: 1, encodingID: 0, subtable: records[3].subtable },
        records[4],
      ]);

      expect(await parseCmap(blob)).toEqual({ 0x41: 5 });
    });
  });

  describe('errors', () => {
    test('lists the formats of the Unicode records it found', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildUnsupportedSubtable(8),
        },
        {
          platformID: 3,
          encodingID: 1,
          subtable: buildUnsupportedSubtable(6),
        },
        {
          platformID: 0,
          encodingID: 3,
          subtable: buildUnsupportedSubtable(2),
        },
      ]);

      await expect(parseCmap(blob)).rejects.toThrow(
        'Unsupported cmap subtable format: (3, 10) is format 8; ' +
          '(3, 1) is format 6; (0, 3) is format 2. ' +
          'Only formats 4, 12, 13 are supported.',
      );
    });

    test('lists the records it found when none is a Unicode record', async () => {
      const blob = buildCmap([
        { platformID: 1, encodingID: 0, subtable: buildUnsupportedSubtable(0) },
        {
          platformID: 0,
          encodingID: 5,
          subtable: buildUnsupportedSubtable(14),
        },
      ]);

      await expect(parseCmap(blob)).rejects.toThrow(
        'No Unicode cmap subtable. Expected one of ' +
          '(3, 10), (0, 4), (0, 6), (3, 1), (0, 3) (platformID, encodingID); ' +
          'found (1, 0), (0, 5).',
      );
    });

    test('says so when there are no records at all', async () => {
      await expect(parseCmap(buildCmap([]))).rejects.toThrow(
        '(platformID, encodingID); found none.',
      );
    });
  });
});

const assetPath = (name: string): string =>
  path.join(__dirname, '../../../../assets', name);

// Hides cmap encoding records in a copy of a font by changing their
// encodingID to one parseCmap doesn't look for.
const hideRecords = async (
  font: Buffer,
  records: readonly (readonly [number, number])[],
): Promise<Buffer> => {
  const dir = await parseDirectory(new Blob([font]));
  const cmapOffset = dir.tableRecords['cmap'].offset;
  const patched = Buffer.from(font);
  const numTables = patched.readUInt16BE(cmapOffset + 2);
  let hidden = 0;
  for (let i = 0; i < numTables; i++) {
    const recordOffset = cmapOffset + 4 + i * 8;
    const platformID = patched.readUInt16BE(recordOffset);
    const encodingID = patched.readUInt16BE(recordOffset + 2);
    if (records.some(([p, e]) => p === platformID && e === encodingID)) {
      patched.writeUInt16BE(0xffff, recordOffset + 2);
      hidden++;
    }
  }
  expect(hidden).toBe(records.length);
  return patched;
};

const getCmapBlob = async (buffer: Buffer): Promise<Blob> => {
  const blob = new Blob([buffer]);
  const { offset, length } = (await parseDirectory(blob)).tableRecords['cmap'];
  return blob.slice(offset, offset + length);
};

const bmpOnly = (map: Record<number, number>): Record<number, number> =>
  Object.fromEntries(
    Object.entries(map).filter(([code]) => Number(code) <= 0xffff),
  );

describe('STIX2Math with only a format 4 cmap', () => {
  const original = fs.readFileSync(assetPath('STIX2Math.otf'));

  // STIX2Math has (0, 3), (0, 5), (3, 1) and (3, 10) subtables. Hiding the
  // (3, 10) record makes the parser fall back to the (3, 1) format 4 subtable.
  const hideFormat12 = (): Promise<Buffer> => hideRecords(original, [[3, 10]]);

  test('format 4 maps every BMP code point the same as format 12', async () => {
    const format12 = await parseCmap(await getCmapBlob(original));
    const format4 = await parseCmap(await getCmapBlob(await hideFormat12()));

    // Sanity check that the font has plenty of BMP characters, and some
    // beyond the BMP that format 4 can't encode.
    expect(Object.keys(bmpOnly(format12)).length).toBeGreaterThan(1000);
    expect(Object.keys(format12).length).toBeGreaterThan(
      Object.keys(bmpOnly(format12)).length,
    );

    expect(format4).toEqual(bmpOnly(format12));
  });

  test('the (0, 3) subtable maps the same as (3, 1)', async () => {
    const windows = await parseCmap(await getCmapBlob(await hideFormat12()));
    const unicode = await parseCmap(
      await getCmapBlob(
        await hideRecords(original, [
          [3, 10],
          [3, 1],
        ]),
      ),
    );

    expect(unicode).toEqual(windows);
  });

  test('getGlyphID returns the same IDs', async () => {
    const font12 = await parse(new Blob([original]));
    const font4 = await parse(new Blob([await hideFormat12()]));

    for (const char of ['a', 'Z', '0', '+', '=', '(', '∑', '∫', '√', 'π']) {
      expect(font4.getGlyphID(char)).toEqual(font12.getGlyphID(char));
    }
  });
});

describe('Latin Modern Math with only Unicode-platform subtables', () => {
  // Latin Modern Math has (0, 3), (0, 4), (1, 0), (3, 1) and (3, 10)
  // subtables. Hiding both Windows records leaves (0, 4) format 12.
  const original = fs.readFileSync(assetPath('latinmodern-math.otf'));

  test('the (0, 4) subtable maps the same as (3, 10)', async () => {
    const windows = await parseCmap(await getCmapBlob(original));
    const unicode = await parseCmap(
      await getCmapBlob(
        await hideRecords(original, [
          [3, 10],
          [3, 1],
        ]),
      ),
    );

    // Latin Modern Math has characters beyond the BMP, so this shows the
    // full-repertoire subtable was read, not (0, 3).
    expect(Object.keys(windows).length).toBeGreaterThan(
      Object.keys(bmpOnly(windows)).length,
    );
    expect(unicode).toEqual(windows);
  });

  test('parse reads a font with no Windows cmap subtables', async () => {
    const font = await parse(
      new Blob([
        await hideRecords(original, [
          [3, 10],
          [3, 1],
        ]),
      ]),
    );
    const reference = await parse(new Blob([original]));

    for (const char of ['a', 'x', '=', '∫', '𝑥']) {
      expect(font.getGlyphID(char)).toEqual(reference.getGlyphID(char));
    }
  });
});
