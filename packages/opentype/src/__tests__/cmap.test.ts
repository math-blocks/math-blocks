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
};

// Builds a cmap table with a single (3, 1) format 4 subtable.
const buildFormat4Cmap = (segments: readonly Segment[]): Blob => {
  const segCount = segments.length;
  const glyphIdArray: number[] = [];
  const idRangeOffsets: number[] = segments.map((segment, i) => {
    if (!segment.glyphIds) {
      return 0;
    }
    // Byte offset from idRangeOffset[i] to the segment's first entry in
    // glyphIdArray[], which starts right after idRangeOffset[].
    const offset = (segCount - i + glyphIdArray.length) * 2;
    glyphIdArray.push(...segment.glyphIds);
    return offset;
  });

  const subtableLength = 16 + segCount * 8 + glyphIdArray.length * 2;
  const headerLength = 4 + 8;
  const buffer = new ArrayBuffer(headerLength + subtableLength);
  const view = new DataView(buffer);

  // cmap header with one encoding record.
  view.setUint16(0, 0); // version
  view.setUint16(2, 1); // numTables
  view.setUint16(4, 3); // platformID
  view.setUint16(6, 1); // encodingID
  view.setUint32(8, headerLength); // subtableOffset

  let pos = headerLength;
  const write16 = (value: number): void => {
    view.setUint16(pos, value & 0xffff);
    pos += 2;
  };

  write16(4); // format
  write16(subtableLength); // length
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

  return new Blob([buffer]);
};

describe('parseCmap', () => {
  describe('format 4', () => {
    test('idRangeOffset == 0 uses code + idDelta', async () => {
      const blob = buildFormat4Cmap([
        { startCode: 0x41, endCode: 0x43, idDelta: 10 - 0x41 },
        { startCode: 0xffff, endCode: 0xffff, idDelta: 1 },
      ]);

      expect(await parseCmap(blob)).toEqual({ 0x41: 10, 0x42: 11, 0x43: 12 });
    });

    test('idDelta wraps around modulo 65536', async () => {
      const blob = buildFormat4Cmap([
        // 0xf000 + 0x1003 = 0x10003, which wraps to 3.
        { startCode: 0xf000, endCode: 0xf001, idDelta: 0x1003 },
        // 0x20 - 0x1e = 2, written as the uint16 0xffe2.
        { startCode: 0x20, endCode: 0x20, idDelta: -0x1e },
        { startCode: 0xffff, endCode: 0xffff, idDelta: 1 },
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
        { startCode: 0xffff, endCode: 0xffff, idDelta: 1 },
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
        { startCode: 0xffff, endCode: 0xffff, idDelta: 1 },
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

  test('throws when there is no (3, 10) or (3, 1) subtable', async () => {
    const buffer = new ArrayBuffer(12);
    const view = new DataView(buffer);
    view.setUint16(2, 1); // numTables
    view.setUint16(4, 0); // platformID
    view.setUint16(6, 3); // encodingID
    view.setUint32(8, 12);

    await expect(parseCmap(new Blob([buffer]))).rejects.toThrow(
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
