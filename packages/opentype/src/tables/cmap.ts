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

const hex = (code: number): string =>
  `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;

// The largest Unicode code point. Characters in cmap groups can't go past it.
const MAX_CODE_POINT = 0x10ffff;

type MapGroup = {
  readonly startCharCode: number; // uint32
  readonly endCharCode: number; // uint32
  readonly glyphID: number; // uint32
};

// Formats 12 and 13 share a layout: a header, then groups of
// (startCharCode, endCharCode, glyphID). In format 12 (segmented coverage)
// each group maps to consecutive glyphs starting at glyphID. In format 13
// (many-to-one range mappings) every character in a group maps to glyphID.
// https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#format-12-segmented-coverage
// https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#format-13-many-to-one-range-mappings
const parseMapGroups = async (
  blob: ByteSource,
  subtableOffset: number,
  format: 12 | 13,
): Promise<Record<number, number>> => {
  const HEADER_SIZE = 2 + 2 + 4 + 4 + 4;
  const GROUP_SIZE = 12;

  const headerBuffer = await blob
    .slice(subtableOffset, subtableOffset + HEADER_SIZE)
    .arrayBuffer();
  const header = new DataView(headerBuffer);

  const length = header.getUint32(4);
  const numGroups = header.getUint32(12);

  const subtableBuffer = await blob
    .slice(subtableOffset, subtableOffset + length)
    .arrayBuffer();
  const view = new DataView(subtableBuffer);

  const groups: MapGroup[] = [];
  for (let i = 0; i < numGroups; i++) {
    const offset = HEADER_SIZE + i * GROUP_SIZE;
    const group = {
      startCharCode: view.getUint32(offset + 0),
      endCharCode: view.getUint32(offset + 4),
      glyphID: view.getUint32(offset + 8),
    };
    // Checked before expanding any group, because a corrupt endCharCode (up
    // to 0xFFFFFFFF) would otherwise loop for billions of iterations.
    if (
      group.startCharCode > group.endCharCode ||
      group.endCharCode > MAX_CODE_POINT
    ) {
      const range = `${hex(group.startCharCode)}..${hex(group.endCharCode)}`;
      throw new Error(
        `Malformed cmap format ${format} subtable: group ${i} (${range}) ` +
          (group.startCharCode > group.endCharCode
            ? 'ends before it starts'
            : `goes past ${hex(MAX_CODE_POINT)}`),
      );
    }
    groups.push(group);
  }

  const result: Record<number, number> = {};
  for (const group of groups) {
    for (
      let charCode = group.startCharCode;
      charCode <= group.endCharCode;
      charCode++
    ) {
      result[charCode] =
        format === 12
          ? group.glyphID + (charCode - group.startCharCode)
          : group.glyphID;
    }
  }

  return result;
};

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

// The Unicode subtables parseCmap reads, most preferred first: full
// repertoire before BMP-only, and Windows before Unicode platform within each.
// https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#unicode-platform-platform-id--0
// https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#windows-platform-platform-id--3
const PREFERRED_RECORDS: readonly (readonly [number, number])[] = [
  [3, 10], // Windows, Unicode full repertoire (format 12 or 13)
  [0, 4], // Unicode 2.0 and later, full repertoire (format 12)
  [0, 6], // Unicode full repertoire, for last-resort fonts (format 13)
  [3, 1], // Windows, Unicode BMP (format 4)
  [0, 3], // Unicode 2.0 and later, BMP only (format 4)
];

const SUPPORTED_FORMATS = [4, 12, 13];

const describeRecord = (record: EncodingRecord): string =>
  `(${record.platformID}, ${record.encodingID})`;

// Returns a map between character codes and GIDs, read from the most preferred
// Unicode subtable (see PREFERRED_RECORDS) that's in a format we can read.
export const parseCmap = async (
  blob: ByteSource,
): Promise<Record<number, number>> => {
  const cmap = await parseCmapHeader(blob);

  const getFormat = async (record: EncodingRecord): Promise<number> => {
    const buffer = await blob
      .slice(record.subtableOffset, record.subtableOffset + 2)
      .arrayBuffer();
    return new DataView(buffer).getUint16(0);
  };

  const unsupported: string[] = [];

  for (const [platformID, encodingID] of PREFERRED_RECORDS) {
    const record = cmap.encodingRecords.find(
      (r) => r.platformID === platformID && r.encodingID === encodingID,
    );
    if (!record) {
      continue;
    }
    const format = await getFormat(record);
    switch (format) {
      case 4:
        return parseFormat4(blob, record.subtableOffset);
      case 12:
      case 13:
        return parseMapGroups(blob, record.subtableOffset, format);
      default:
        unsupported.push(`${describeRecord(record)} is format ${format}`);
    }
  }

  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported cmap subtable format: ${unsupported.join('; ')}. ` +
        `Only formats ${SUPPORTED_FORMATS.join(', ')} are supported.`,
    );
  }

  const expected = PREFERRED_RECORDS.map(([p, e]) => `(${p}, ${e})`).join(', ');
  const found = cmap.encodingRecords.map(describeRecord).join(', ') || 'none';
  throw new Error(
    `No Unicode cmap subtable. Expected one of ${expected} ` +
      `(platformID, encodingID); found ${found}.`,
  );
};
