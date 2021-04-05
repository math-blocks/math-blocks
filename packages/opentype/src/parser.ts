import {parseCFF} from "./cff";
import {parseCmap} from "./cmap";
import {parseMATH} from "./math";
import {parseHead} from "./head";

import type {TableRecord, TableDirectory} from "./types";

const parseTag = (view: DataView, offset = 0): string => {
    return [
        view.getUint8(offset + 0),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
    ]
        .map((x) => String.fromCharCode(x))
        .join("");
};

const parseTableRecords = async (
    blob: Blob,
    offset: number,
    numTables: number,
): Promise<TableRecord[]> => {
    const size = 4 + 4 + 4 + 4;

    const buffer = await blob
        .slice(offset, offset + numTables * size)
        .arrayBuffer();
    const view = new DataView(buffer);

    const result: TableRecord[] = [];

    for (let i = 0; i < numTables; i++) {
        const offset = i * size;
        result.push({
            tableTag: parseTag(view, offset),
            checksum: view.getUint32(offset + 4),
            offset: view.getUint32(offset + 8),
            length: view.getUint32(offset + 12),
        });
    }

    return result;
};

const parseDirectory = async (blob: Blob): Promise<TableDirectory> => {
    const byteCount = 4 + 8;

    const buffer = await blob.slice(0, byteCount).arrayBuffer();
    const view = new DataView(buffer);

    const numTables = view.getUint16(4);

    const dir: TableDirectory = {
        sfntVersion: parseTag(view), // tag, 4 bytes
        numTables: numTables, // uint16
        searchRange: view.getUint16(6),
        entrySelector: view.getUint16(8),
        rangeShift: view.getUint16(10),
        tableRecords: await parseTableRecords(blob, 12, numTables),
    };

    return dir;
};

export const parse = async (url: string): Promise<void> => {
    const res = await fetch(url);
    const blob = await res.blob();

    const dir = await parseDirectory(blob);

    const cmapTableRecord = dir.tableRecords.find((r) => r.tableTag === "cmap");
    if (cmapTableRecord) {
        const glyphIndexMap = await parseCmap(blob, cmapTableRecord);
        console.log("glyphIndexMap = ", glyphIndexMap);
    }

    const mathTableRecord = dir.tableRecords.find((r) => r.tableTag === "MATH");
    if (mathTableRecord) {
        const result = await parseMATH(blob, mathTableRecord);
        console.log("MATH = ", result);
    }

    const headTableRecord = dir.tableRecords.find((r) => r.tableTag === "head");
    if (headTableRecord) {
        const result = await parseHead(blob, headTableRecord);
        console.log("head = ", result);
    }

    const cffTableRecord = dir.tableRecords.find((r) => r.tableTag === "CFF ");
    console.log("cffTableRecord = ", cffTableRecord);
    console.log(blob.size);
    if (cffTableRecord) {
        const cffBlob = blob.slice(
            cffTableRecord.offset,
            cffTableRecord.offset + cffTableRecord.length,
        );
        const result = await parseCFF(cffBlob);
        console.log("CFF = ", result);
    }

    console.log(dir);
};
