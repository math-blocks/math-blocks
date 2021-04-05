import type {TableRecord} from "./types";

type HeaderTable = {
    majorVersion: number; // uint16
    minorVersion: number; // uint16
    fontRevision: number; // signed fixed-point number 16.16
    checksumAdjustment: number; // uint32
    magicNumber: number; // uint32
    flags: number; // uint16
    unitsPerEm: number; // uint16
    created: number; // BigInt; // LONGDATETIME
    modified: number; // BigInt; // LONGDATETIME
    xMin: number; // int16
    yMin: number; // int16
    xMax: number; // int16
    yMax: number; // int16
    macStyle: number; // uint16 - bitfield
    lowestRecPPEM: number; // uint16
    fontDirectionHint: number; // int16
    indexToLocFormat: number; // int16
    glyphDataFormat: number; // int16
};

export const parseHead = async (
    blob: Blob,
    tableRecord: TableRecord,
): Promise<HeaderTable> => {
    const size = 54;
    const buffer = await blob
        .slice(tableRecord.offset, tableRecord.offset + size)
        .arrayBuffer();
    const view = new DataView(buffer);

    const table: HeaderTable = {
        majorVersion: view.getUint16(0),
        minorVersion: view.getUint16(2),
        fontRevision: 0, // TODO: parse signed fixed-point number 16.16
        checksumAdjustment: view.getUint32(8),
        magicNumber: view.getUint32(12),
        flags: view.getUint16(16),
        unitsPerEm: view.getUint16(18),
        created: 0, // view.getBigInt64(20), // LONGDATETIME
        modified: 0, // view.getBigInt64(28), // LONGDATETIME
        xMin: view.getInt16(36),
        yMin: view.getInt16(38),
        xMax: view.getInt16(40),
        yMax: view.getInt16(42),
        macStyle: view.getUint16(44),
        lowestRecPPEM: view.getUint16(46),
        fontDirectionHint: view.getUint16(48),
        indexToLocFormat: view.getUint16(50),
        glyphDataFormat: view.getUint16(52),
    };

    return table;
};
