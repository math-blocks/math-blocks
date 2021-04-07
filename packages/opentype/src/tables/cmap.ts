type EncodingRecord = {
    platformID: number; // uint16
    encodingID: number; // uint16
    subtableOffset: number; // uint32
};

type CmapHeader = {
    version: number; // uint16
    numTables: number; // uint16
    encodingRecords: EncodingRecord[];
};

const parseEncodingRecords = async (
    blob: Blob,
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

const parseCmapHeader = async (blob: Blob): Promise<CmapHeader> => {
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
    startCharCode: number; // uint32
    endCharCode: number; // uint32
    startGlyphID: number; // uint32
};

// Returns a map between character codes and GID.
const getGlyphIndexMap = (
    groups: SequentialMapGroup[],
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

export const parseCmap = async (
    blob: Blob,
): Promise<Record<number, number>> => {
    const cmap = await parseCmapHeader(blob);

    const encodingRecord = cmap.encodingRecords.find(
        (record) => record.platformID === 3 && record.encodingID === 10,
    );

    if (!encodingRecord) {
        throw new Error(
            "Missing encoding record for platformID = 3, encodingID = 10",
        );
    }

    const format12size = 2 + 2 + 4 + 4 + 4;

    const subtableHeader = blob.slice(
        encodingRecord.subtableOffset,
        encodingRecord.subtableOffset + format12size,
    );

    const buffer = await subtableHeader.arrayBuffer();
    const view = new DataView(buffer);

    // TODO: create a separate function for parser format 12
    const format12Header = {
        format: view.getUint16(0),
        reserved: view.getUint16(2),
        length: view.getUint32(4),
        language: view.getUint32(8),
        numGroups: view.getUint32(12),
    };

    const subtableBlob = blob.slice(
        encodingRecord.subtableOffset,
        encodingRecord.subtableOffset + format12Header.length,
    );

    const subtableBuffer = await subtableBlob.arrayBuffer();
    const array = new DataView(subtableBuffer);

    const HEADER_SIZE = 16;
    const GROUP_SIZE = 12;

    const groups: SequentialMapGroup[] = [];

    for (let i = 0; i < format12Header.numGroups; i++) {
        const offset = HEADER_SIZE + i * GROUP_SIZE;
        groups.push({
            startCharCode: array.getUint32(offset + 0),
            endCharCode: array.getUint32(offset + 4),
            startGlyphID: array.getUint32(offset + 8),
        });
    }

    return getGlyphIndexMap(groups);
};
