import {parseCFF} from "./tables/cff";
import {parseCmap} from "./tables/cmap";
import {parseMATH} from "./tables/math";
import {parseHead} from "./tables/head";

import {getGlyphMetrics} from "./util";

import type {Font} from "./font";
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
): Promise<Record<string, TableRecord>> => {
    const RECORD_SIZE = 4 + 4 + 4 + 4;

    const buffer = await blob
        .slice(offset, offset + numTables * RECORD_SIZE)
        .arrayBuffer();
    const view = new DataView(buffer);

    const result: Record<string, TableRecord> = {};

    for (let i = 0; i < numTables; i++) {
        const offset = i * RECORD_SIZE;
        const tag = parseTag(view, offset);

        result[tag] = {
            tableTag: parseTag(view, offset),
            checksum: view.getUint32(offset + 4),
            offset: view.getUint32(offset + 8),
            length: view.getUint32(offset + 12),
        };
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

export const parse = async (url: string): Promise<Font> => {
    const res = await fetch(url);
    const blob = await res.blob();

    const dir = await parseDirectory(blob);

    // TODO: move the blob for each table record into the parseDirector result
    const cmapTableRecord = dir.tableRecords["cmap"];
    if (!cmapTableRecord) {
        throw new Error("No TableRecord for 'cmap' table");
    }
    const cmapBlob = blob.slice(
        cmapTableRecord.offset,
        cmapTableRecord.offset + cmapTableRecord.length,
    );
    const glyphIndexMap = await parseCmap(cmapBlob);

    const mathTableRecord = dir.tableRecords["MATH"];
    if (!mathTableRecord) {
        throw new Error("No TableRecord for 'MATH' table");
    }
    const mathBlob = blob.slice(
        mathTableRecord.offset,
        mathTableRecord.offset + mathTableRecord.length,
    );
    const math = await parseMATH(mathBlob);

    const headTableRecord = dir.tableRecords["head"];
    if (!headTableRecord) {
        throw new Error("No TableRecord for 'head' table");
    }
    const headBlob = blob.slice(
        headTableRecord.offset,
        headTableRecord.offset + headTableRecord.length,
    );
    const head = await parseHead(headBlob);

    const cffTableRecord = dir.tableRecords["CFF "];
    if (!cffTableRecord) {
        throw new Error("No TableRecord for 'CFF ' table");
    }
    const cffBlob = blob.slice(
        cffTableRecord.offset,
        cffTableRecord.offset + cffTableRecord.length,
    );
    const cff = await parseCFF(cffBlob);

    const font: Font = {
        head,
        math,
        glyphIndexMap,
        getGlyph: cff.getGlyph,
        getGlyphMetrics: (gid: number) => {
            const glyph = cff.getGlyph(gid);
            return getGlyphMetrics(glyph);
        },
    };

    console.log(dir);

    return font;
};
