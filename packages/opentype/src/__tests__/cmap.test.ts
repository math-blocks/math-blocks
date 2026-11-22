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

  describe('choosing a subtable', () => {
    const bmp = buildFormat4Subtable([
      { startCode: 0x41, endCode: 0x41, idDelta: 7 - 0x41 },
      SENTINEL,
    ]);

    test('falls back to (3, 1) when (3, 10) is in an unsupported format', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildUnsupportedSubtable(13),
        },
        { platformID: 3, encodingID: 1, subtable: bmp },
      ]);

      expect(await parseCmap(blob)).toEqual({ 0x41: 7 });
    });

    test('throws when neither subtable is in a supported format', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 10,
          subtable: buildUnsupportedSubtable(13),
        },
        {
          platformID: 3,
          encodingID: 1,
          subtable: buildUnsupportedSubtable(6),
        },
      ]);

      await expect(parseCmap(blob)).rejects.toThrow(
        'Unsupported cmap subtable format: ' +
          'platformID = 3, encodingID = 10 is format 13; ' +
          'platformID = 3, encodingID = 1 is format 6.',
      );
    });

    test('throws when the only (3, 1) subtable is in an unsupported format', async () => {
      const blob = buildCmap([
        {
          platformID: 3,
          encodingID: 1,
          subtable: buildUnsupportedSubtable(6),
        },
      ]);

      await expect(parseCmap(blob)).rejects.toThrow(
        'Unsupported cmap subtable format: platformID = 3, encodingID = 1 is format 6.',
      );
    });
  });

  test('throws when there is no (3, 10) or (3, 1) subtable', async () => {
    const blob = buildCmap([
      { platformID: 0, encodingID: 3, subtable: buildUnsupportedSubtable(4) },
    ]);

    await expect(parseCmap(blob)).rejects.toThrow(
      'Missing encoding record for platformID = 3, encodingID = 10 or 1',
    );
  });
});

describe('STIX2Math with only a format 4 cmap', () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const original = fs.readFileSync(fontPath);

  // STIX2Math has (0, 3), (0, 5), (3, 1) and (3, 10) subtables. Changing the
  // encodingID of the (3, 10) record hides it, so the parser has to fall back
  // to the (3, 1) format 4 subtable.
  const hideFormat12 = async (): Promise<Buffer> => {
    const dir = await parseDirectory(new Blob([original]));
    const cmapOffset = dir.tableRecords['cmap'].offset;
    const patched = Buffer.from(original);
    const numTables = patched.readUInt16BE(cmapOffset + 2);
    let found = false;
    for (let i = 0; i < numTables; i++) {
      const recordOffset = cmapOffset + 4 + i * 8;
      if (
        patched.readUInt16BE(recordOffset) === 3 &&
        patched.readUInt16BE(recordOffset + 2) === 10
      ) {
        patched.writeUInt16BE(0xffff, recordOffset + 2);
        found = true;
      }
    }
    expect(found).toBe(true);
    return patched;
  };

  const getCmapBlob = async (buffer: Buffer): Promise<Blob> => {
    const blob = new Blob([buffer]);
    const { offset, length } = (await parseDirectory(blob)).tableRecords[
      'cmap'
    ];
    return blob.slice(offset, offset + length);
  };

  test('format 4 maps every BMP code point the same as format 12', async () => {
    const format12 = await parseCmap(await getCmapBlob(original));
    const format4 = await parseCmap(await getCmapBlob(await hideFormat12()));

    const bmpEntries = Object.entries(format12).filter(
      ([code]) => Number(code) <= 0xffff,
    );
    // Sanity check that the font has plenty of BMP characters, and some
    // beyond the BMP that format 4 can't encode.
    expect(bmpEntries.length).toBeGreaterThan(1000);
    expect(Object.keys(format12).length).toBeGreaterThan(bmpEntries.length);

    expect(format4).toEqual(Object.fromEntries(bmpEntries));
  });

  test('getGlyphID returns the same IDs', async () => {
    const font12 = await parse(new Blob([original]));
    const font4 = await parse(new Blob([await hideFormat12()]));

    for (const char of ['a', 'Z', '0', '+', '=', '(', '∑', '∫', '√', 'π']) {
      expect(font4.getGlyphID(char)).toEqual(font12.getGlyphID(char));
    }
  });
});
