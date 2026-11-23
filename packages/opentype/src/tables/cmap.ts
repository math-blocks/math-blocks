import type { ByteSource } from '../byte-source';

type EncodingRecord = {
  readonly platformID: number; // uint16
  readonly encodingID: number; // uint16
  readonly subtableOffset: number; // uint32
};

type CmapHeader = {
  readonly version: number; // uint16
  readonly numTables: number; // uint16
  readonly encodingRecords: readonly EncodingRecord[];
};

const parseEncodingRecords = async (
  blob: ByteSource,
  offset: number,
  numTables: number,
): Promise<EncodingRecord[]> => {
  const size = 2 + 2 + 4;
  const buffer = await blob
    .slice(offset, offset + numTables * size)
    .arrayBuffer();
  const view = new DataView(buffer);

  const result: EncodingRecord[] = [];

  for (let i = 0; i < numTables; i++) {
    const offset = i * size;
    result.push({
      platformID: view.getUint16(offset + 0),
      encodingID: view.getUint16(offset + 2),
      subtableOffset: view.getUint32(offset + 4),
    });
  }

  return result;
};

const parseCmapHeader = async (blob: ByteSource): Promise<CmapHeader> => {
  let buffer, view;

  buffer = await blob.slice(0, 4).arrayBuffer();
  view = new DataView(buffer);

  const version = view.getUint16(0);
  const numTables = view.getUint16(2);

  const encodingRecordSize = 2 + 2 + 4;
  buffer = await blob.slice(4, numTables * encodingRecordSize).arrayBuffer();
  view = new DataView(buffer);

  return {
    version: version,
    numTables: numTables,
    encodingRecords: await parseEncodingRecords(blob, 4, numTables),
  };
};

type SequentialMapGroup = {
  readonly startCharCode: number; // uint32
  readonly endCharCode: number; // uint32
  readonly startGlyphID: number; // uint32
};

// Returns a map between character codes and GID.
const getGlyphIndexMap = (
  groups: readonly SequentialMapGroup[],
): Record<number, number> => {
  const result: Record<number, number> = {};

  for (const group of groups) {
    for (
      let charCode = group.startCharCode, i = 0;
      charCode <= group.endCharCode;
      charCode++, i++
    ) {
      const glyphId = group.startGlyphID + i;
      result[charCode] = glyphId;
    }
  }

  return result;
};

const parseFormat12 = async (
  blob: ByteSource,
  subtableOffset: number,
): Promise<Record<number, number>> => {
  const format12size = 2 + 2 + 4 + 4 + 4;

  const headerBuffer = await blob
    .slice(subtableOffset, subtableOffset + format12size)
    .arrayBuffer();
  const header = new DataView(headerBuffer);

  const length = header.getUint32(4);
  const numGroups = header.getUint32(12);

  const subtableBuffer = await blob
    .slice(subtableOffset, subtableOffset + length)
    .arrayBuffer();
  const view = new DataView(subtableBuffer);

  const HEADER_SIZE = 16;
  const GROUP_SIZE = 12;

  const groups: SequentialMapGroup[] = [];

  for (let i = 0; i < numGroups; i++) {
    const offset = HEADER_SIZE + i * GROUP_SIZE;
    groups.push({
      startCharCode: view.getUint32(offset + 0),
      endCharCode: view.getUint32(offset + 4),
      startGlyphID: view.getUint32(offset + 8),
    });
  }

  return getGlyphIndexMap(groups);
};

const hex = (code: number): string =>
  `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;

// Format 4: segment mapping to delta values. Only covers the BMP.
// https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#format-4-segment-mapping-to-delta-values
const parseFormat4 = async (
  blob: ByteSource,
  subtableOffset: number,
): Promise<Record<number, number>> => {
  const headerBuffer = await blob
    .slice(subtableOffset, subtableOffset + 4)
    .arrayBuffer();
  const length = new DataView(headerBuffer).getUint16(2);

  const subtableBuffer = await blob
    .slice(subtableOffset, subtableOffset + length)
    .arrayBuffer();
  const view = new DataView(subtableBuffer);

  const segCountX2 = view.getUint16(6);
  const segCount = segCountX2 / 2;

  const endCodeOffset = 14;
  // There's a uint16 reservedPad between endCode[] and startCode[].
  const startCodeOffset = endCodeOffset + segCountX2 + 2;
  const idDeltaOffset = startCodeOffset + segCountX2;
  const idRangeOffsetOffset = idDeltaOffset + segCountX2;

  const result: Record<number, number> = {};

  for (let i = 0; i < segCount; i++) {
    const endCode = view.getUint16(endCodeOffset + i * 2);
    const startCode = view.getUint16(startCodeOffset + i * 2);
    const idDelta = view.getInt16(idDeltaOffset + i * 2);
    const idRangeOffsetPos = idRangeOffsetOffset + i * 2;
    const idRangeOffset = view.getUint16(idRangeOffsetPos);

    for (let code = startCode; code <= endCode; code++) {
      // The last segment ends at 0xFFFF, which isn't a character. It's
      // usually a segment of its own, but can be the end of a longer one.
      if (code === 0xffff) {
        continue;
      }
      let glyphId: number;
      if (idRangeOffset === 0) {
        glyphId = (code + idDelta) & 0xffff;
      } else {
        // idRangeOffset is a byte offset from its own position in the
        // idRangeOffset[] array into glyphIdArray[].
        const glyphIdPos =
          idRangeOffsetPos + idRangeOffset + (code - startCode) * 2;
        if (glyphIdPos + 2 > view.byteLength) {
          const range = `${hex(startCode)}..${hex(endCode)}`;
          throw new Error(
            `Malformed cmap format 4 subtable: segment ${i} (${range}) ` +
              'reads past the end of glyphIdArray',
          );
        }
        const rawGlyphId = view.getUint16(glyphIdPos);
        glyphId = rawGlyphId === 0 ? 0 : (rawGlyphId + idDelta) & 0xffff;
      }
      if (glyphId !== 0) {
        result[code] = glyphId;
      }
    }
  }

  return result;
};

// Returns a map between character codes and GIDs. Uses the Windows Unicode
// full repertoire subtable (3, 10) when there is one, and falls back to the
// Windows Unicode BMP subtable (3, 1) otherwise.
export const parseCmap = async (
  blob: ByteSource,
): Promise<Record<number, number>> => {
  const cmap = await parseCmapHeader(blob);

  const findRecord = (
    platformID: number,
    encodingID: number,
  ): EncodingRecord | undefined =>
    cmap.encodingRecords.find(
      (record) =>
        record.platformID === platformID && record.encodingID === encodingID,
    );

  const getFormat = async (record: EncodingRecord): Promise<number> => {
    const buffer = await blob
      .slice(record.subtableOffset, record.subtableOffset + 2)
      .arrayBuffer();
    return new DataView(buffer).getUint16(0);
  };

  const fullRecord = findRecord(3, 10);
  const fullFormat = fullRecord ? await getFormat(fullRecord) : undefined;
  if (fullRecord && fullFormat === 12) {
    return parseFormat12(blob, fullRecord.subtableOffset);
  }

  // Also used when the (3, 10) subtable is in a format we can't read.
  const bmpRecord = findRecord(3, 1);
  const bmpFormat = bmpRecord ? await getFormat(bmpRecord) : undefined;
  if (bmpRecord && bmpFormat === 4) {
    return parseFormat4(blob, bmpRecord.subtableOffset);
  }

  if (!fullRecord && !bmpRecord) {
    throw new Error(
      'Missing encoding record for platformID = 3, encodingID = 10 or 1',
    );
  }

  const found = [
    fullRecord && `platformID = 3, encodingID = 10 is format ${fullFormat}`,
    bmpRecord && `platformID = 3, encodingID = 1 is format ${bmpFormat}`,
  ].filter(Boolean);
  throw new Error(
    `Unsupported cmap subtable format: ${found.join('; ')}. ` +
      'Only format 12 for encodingID = 10 and format 4 for encodingID = 1 are supported.',
  );
};
