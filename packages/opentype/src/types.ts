export type TableRecord = {
    tableTag: string; // 4 bytes
    checksum: number; // uint32
    offset: number; // uint32
    length: number; // uint32
};

export type TableDirectory = {
    sfntVersion: string; // 4 bytes
    numTables: number; // uint16
    searchRange: number; // uint16
    entrySelector: number; // uint16
    rangeShift: number; // uint16
    tableRecords: TableRecord[];
};
