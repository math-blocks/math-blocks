import fs from 'fs';
import path from 'path';
import { deflateSync } from 'zlib';

import { glyphGroups } from '../glyph-groups';
import { fromArrayBuffer } from '../byte-source';
import { parse, parseDirectory } from '../parser';
import { ASSETS, FONTS, describeCharacter, getGlyphID } from '../test-util';
import { isWoff, woffToSfnt } from '../woff';

const readFile = (...segments: readonly string[]): ArrayBuffer => {
  const file = fs.readFileSync(path.join(ASSETS, ...segments));
  const buffer = new ArrayBuffer(file.byteLength);
  new Uint8Array(buffer).set(file);
  return buffer;
};

// Each table's tag, checksum and bytes, ignoring where in the file it is.
const readTables = async (
  buffer: ArrayBuffer,
): Promise<Record<string, { checksum: number; bytes: Uint8Array }>> => {
  const dir = await parseDirectory(fromArrayBuffer(buffer));
  return Object.fromEntries(
    Object.values(dir.tableRecords).map((record) => [
      record.tableTag,
      {
        checksum: record.checksum,
        bytes: new Uint8Array(
          buffer.slice(record.offset, record.offset + record.length),
        ),
      },
    ]),
  );
};

// Builds a WOFF file with the given tables, compressing each one that gets
// smaller. Used to make malformed files for the error tests.
const makeWoff = (
  tables: readonly { tag: string; data: Uint8Array; compress?: boolean }[],
): ArrayBuffer => {
  const stored = tables.map((table) => {
    const compressed = deflateSync(table.data);
    return table.compress && compressed.byteLength < table.data.byteLength
      ? new Uint8Array(compressed)
      : table.data;
  });
  let length = 44 + 20 * tables.length;
  const offsets = stored.map((data) => {
    const offset = length;
    length += (data.byteLength + 3) & ~3;
    return offset;
  });
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x774f4646); // 'wOFF'
  view.setUint32(4, 0x4f54544f); // 'OTTO'
  view.setUint32(8, length);
  view.setUint16(12, tables.length);
  tables.forEach((table, i) => {
    const entry = 44 + 20 * i;
    for (let j = 0; j < 4; j++) {
      view.setUint8(entry + j, table.tag.charCodeAt(j));
    }
    view.setUint32(entry + 4, offsets[i]);
    view.setUint32(entry + 8, stored[i].byteLength);
    view.setUint32(entry + 12, table.data.byteLength);
    new Uint8Array(buffer).set(stored[i], offsets[i]);
  });
  return buffer;
};

describe('isWoff', () => {
  test('is true for a .woff subset and false for a .otf one', () => {
    expect(isWoff(readFile('subsets', 'stix-two-math', 'base.woff'))).toBe(
      true,
    );
    expect(isWoff(readFile('subsets', 'stix-two-math', 'base.otf'))).toBe(
      false,
    );
  });

  test('is false for data shorter than the signature', () => {
    expect(isWoff(new ArrayBuffer(2))).toBe(false);
  });
});

describe.each(FONTS)('$subset', ({ subset }) => {
  test.each(glyphGroups)(
    '$name.woff holds the same tables as $name.otf',
    async ({ name }) => {
      const otf = readFile('subsets', subset, `${name}.otf`);
      const woff = readFile('subsets', subset, `${name}.woff`);

      const sfnt = await woffToSfnt(woff);
      expect(await readTables(sfnt)).toEqual(await readTables(otf));
      // The .woff file is the point of the exercise: it's smaller.
      expect(woff.byteLength).toBeLessThan(otf.byteLength);
    },
  );
});

describe('parse', () => {
  test('reads a .woff subset like the matching .otf subset', async () => {
    const otf = await parse(readFile('subsets', 'stix-two-math', 'base.otf'));
    const woff = await parse(readFile('subsets', 'stix-two-math', 'base.woff'));

    expect(woff.cff.name).toEqual(otf.cff.name);
    expect(woff.head).toEqual(otf.head);
    expect(woff.math.constants).toEqual(otf.math.constants);
    for (const char of ['x', '2', '+', '(', '=']) {
      const codePoint = char.codePointAt(0) ?? 0;
      expect(getGlyphID(woff, codePoint)).not.toBeNull();
      expect(describeCharacter(woff, codePoint)).toEqual(
        describeCharacter(otf, codePoint),
      );
    }
  });

  test('reads a .woff subset from a Blob', async () => {
    const file = fs.readFileSync(
      path.join(ASSETS, 'subsets', 'stix-two-math', 'calculus.woff'),
    );
    const font = await parse(new Blob([file]));
    expect(font.getGlyphID('∫')).toBeGreaterThan(0);
  });
});

describe('woffToSfnt', () => {
  const head = new Uint8Array(54).fill(1);
  const repetitive = new Uint8Array(400).fill(7);

  test('lays out the tables after an sfnt table directory', async () => {
    const sfnt = await woffToSfnt(
      makeWoff([
        { tag: 'CFF ', data: repetitive, compress: true },
        { tag: 'head', data: head },
      ]),
    );
    const dir = await parseDirectory(fromArrayBuffer(sfnt));
    expect(dir.sfntVersion).toEqual('OTTO');
    expect(dir.numTables).toEqual(2);
    expect(dir.searchRange).toEqual(32);
    expect(dir.entrySelector).toEqual(1);
    expect(dir.rangeShift).toEqual(0);
    expect(await readTables(sfnt)).toEqual({
      'CFF ': { checksum: 0, bytes: repetitive },
      head: { checksum: 0, bytes: head },
    });
    // Each table starts on a four-byte boundary.
    for (const record of Object.values(dir.tableRecords)) {
      expect(record.offset % 4).toEqual(0);
    }
  });

  test('throws for data without the WOFF signature', async () => {
    await expect(woffToSfnt(new ArrayBuffer(64))).rejects.toThrow(
      'Not a WOFF file',
    );
  });

  test('throws for a truncated header', async () => {
    const buffer = makeWoff([]).slice(0, 20);
    await expect(woffToSfnt(buffer)).rejects.toThrow('header is truncated');
  });

  test('throws when the file is shorter than its header says', async () => {
    const buffer = makeWoff([{ tag: 'head', data: head }]);
    await expect(
      woffToSfnt(buffer.slice(0, buffer.byteLength - 4)),
    ).rejects.toThrow('gives its length as');
  });

  test('throws when the table directory runs past the end', async () => {
    const buffer = makeWoff([]);
    new DataView(buffer).setUint16(12, 5);
    await expect(woffToSfnt(buffer)).rejects.toThrow(
      'table directory is truncated',
    );
  });

  test('throws when a table runs past the end', async () => {
    const buffer = makeWoff([{ tag: 'head', data: head }]);
    new DataView(buffer).setUint32(44 + 4, buffer.byteLength - 8);
    await expect(woffToSfnt(buffer)).rejects.toThrow(
      "the 'head' table is truncated",
    );
  });

  test('throws when a table is larger compressed than uncompressed', async () => {
    const buffer = makeWoff([{ tag: 'head', data: head }]);
    new DataView(buffer).setUint32(44 + 12, 10);
    await expect(woffToSfnt(buffer)).rejects.toThrow(
      'larger compressed (54 bytes) than uncompressed (10 bytes)',
    );
  });

  test('throws when a table decompresses to the wrong length', async () => {
    const buffer = makeWoff([
      { tag: 'CFF ', data: repetitive, compress: true },
    ]);
    new DataView(buffer).setUint32(44 + 12, 500);
    await expect(woffToSfnt(buffer)).rejects.toThrow(
      "the 'CFF ' table decompressed to 400 bytes instead of 500",
    );
  });

  test('rejects a table that is not valid zlib data', async () => {
    const buffer = makeWoff([
      { tag: 'CFF ', data: repetitive, compress: true },
    ]);
    // Corrupt the zlib header of the compressed table.
    new Uint8Array(buffer, 44 + 20).fill(0xff, 0, 2);
    await expect(woffToSfnt(buffer)).rejects.toThrow();
  });

  test('throws a clear error without DecompressionStream', async () => {
    const buffer = makeWoff([
      { tag: 'CFF ', data: repetitive, compress: true },
    ]);
    vi.stubGlobal('DecompressionStream', undefined);
    try {
      await expect(woffToSfnt(buffer)).rejects.toThrow(
        "DecompressionStream isn't available",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
