// Reads WOFF 1.0 files (https://www.w3.org/TR/WOFF/). A WOFF file holds the
// same tables as an OpenType (sfnt) file, each one optionally compressed with
// zlib. The parser only reads sfnt data, so `woffToSfnt` rebuilds the sfnt file
// that the WOFF file was made from.

const WOFF_HEADER_SIZE = 44;
const WOFF_TABLE_ENTRY_SIZE = 20;
const SFNT_HEADER_SIZE = 12;
const SFNT_TABLE_RECORD_SIZE = 16;

// 'wOFF'
const WOFF_SIGNATURE = 0x774f4646;

/** Returns true if `buffer` starts with the WOFF 1.0 signature, 'wOFF'. */
export const isWoff = (buffer: ArrayBuffer): boolean =>
  buffer.byteLength >= 4 &&
  new DataView(buffer).getUint32(0) === WOFF_SIGNATURE;

// Inflates zlib-compressed data with the Compression Streams API, which
// browsers and Node (18+) both have. WOFF tables are compressed with zlib's
// compress2(), whose format the API calls "deflate".
const inflate = async (data: Uint8Array): Promise<Uint8Array> => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      "Can't decompress WOFF tables: DecompressionStream isn't available",
    );
  }
  const stream = new DecompressionStream('deflate');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const chunks: Uint8Array[] = [];
  const readAll = async (): Promise<void> => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      chunks.push(value);
    }
  };
  // Write and read at the same time: the stream applies backpressure, so
  // awaiting the write first could wait forever on a large table. Awaiting
  // both together also means an error from either one isn't left unhandled.
  await Promise.all([
    writer.write(data as Uint8Array<ArrayBuffer>).then(() => writer.close()),
    readAll(),
  ]);

  const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
};

const pad4 = (n: number): number => (n + 3) & ~3;

const tagAt = (view: DataView, offset: number): string =>
  String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );

/**
 * Converts a WOFF 1.0 file to the OpenType (sfnt) file it was made from, by
 * decompressing its tables and laying them out after an sfnt table directory.
 * Throws if `buffer` isn't a well-formed WOFF file.
 */
export const woffToSfnt = async (buffer: ArrayBuffer): Promise<ArrayBuffer> => {
  if (!isWoff(buffer)) {
    throw new Error('Not a WOFF file: missing the wOFF signature');
  }
  if (buffer.byteLength < WOFF_HEADER_SIZE) {
    throw new Error('Invalid WOFF file: the header is truncated');
  }
  const view = new DataView(buffer);
  const flavor = view.getUint32(4);
  const length = view.getUint32(8);
  const numTables = view.getUint16(12);

  if (length !== buffer.byteLength) {
    throw new Error(
      `Invalid WOFF file: the header gives its length as ${length} bytes, ` +
        `but it has ${buffer.byteLength}`,
    );
  }
  if (WOFF_HEADER_SIZE + numTables * WOFF_TABLE_ENTRY_SIZE > length) {
    throw new Error('Invalid WOFF file: the table directory is truncated');
  }

  const tables = await Promise.all(
    Array.from({ length: numTables }, async (_, i) => {
      const entry = WOFF_HEADER_SIZE + i * WOFF_TABLE_ENTRY_SIZE;
      const tag = tagAt(view, entry);
      const offset = view.getUint32(entry + 4);
      const compLength = view.getUint32(entry + 8);
      const origLength = view.getUint32(entry + 12);
      const checksum = view.getUint32(entry + 16);

      if (offset + compLength > length) {
        throw new Error(`Invalid WOFF file: the '${tag}' table is truncated`);
      }
      if (compLength > origLength) {
        throw new Error(
          `Invalid WOFF file: the '${tag}' table is larger compressed ` +
            `(${compLength} bytes) than uncompressed (${origLength} bytes)`,
        );
      }

      const stored = new Uint8Array(buffer, offset, compLength);
      // A table is stored uncompressed when compressing didn't make it
      // smaller, in which case the two lengths are equal.
      const data = compLength < origLength ? await inflate(stored) : stored;
      if (data.byteLength !== origLength) {
        throw new Error(
          `Invalid WOFF file: the '${tag}' table decompressed to ` +
            `${data.byteLength} bytes instead of ${origLength}`,
        );
      }
      return { tag, checksum, data };
    }),
  );

  // The sfnt table directory: a header, then one record per table. Tables
  // follow in the same order, each padded to a multiple of four bytes.
  let sfntSize = SFNT_HEADER_SIZE + numTables * SFNT_TABLE_RECORD_SIZE;
  const offsets = tables.map((table) => {
    const offset = sfntSize;
    sfntSize += pad4(table.data.byteLength);
    return offset;
  });

  const sfnt = new ArrayBuffer(sfntSize);
  const out = new DataView(sfnt);
  const bytes = new Uint8Array(sfnt);

  // searchRange etc. are defined in terms of the largest power of two that's
  // no larger than numTables.
  const entrySelector = numTables > 0 ? Math.floor(Math.log2(numTables)) : 0;
  const searchRange =
    numTables > 0 ? 2 ** entrySelector * SFNT_TABLE_RECORD_SIZE : 0;
  out.setUint32(0, flavor);
  out.setUint16(4, numTables);
  out.setUint16(6, searchRange);
  out.setUint16(8, entrySelector);
  out.setUint16(10, numTables * SFNT_TABLE_RECORD_SIZE - searchRange);

  tables.forEach((table, i) => {
    const record = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;
    for (let j = 0; j < 4; j++) {
      out.setUint8(record + j, table.tag.charCodeAt(j));
    }
    out.setUint32(record + 4, table.checksum);
    out.setUint32(record + 8, offsets[i]);
    out.setUint32(record + 12, table.data.byteLength);
    bytes.set(table.data, offsets[i]);
  });

  return sfnt;
};
