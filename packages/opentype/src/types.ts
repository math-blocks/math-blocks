import type {HeaderTable} from "./tables/head";
import type {MathConstants, VariantsTable} from "./tables/math";
import type {Glyph, TopDict} from "./tables/cff-types";

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
    tableRecords: Record<string, TableRecord>;
};

export type GlyphMetrics = {
    advance: number;
    bearingX: number;
    bearingY: number;
    width: number;
    height: number;
};

export type Font = {
    cff: {
        name: string;
        topDict: TopDict;
    };
    head: HeaderTable;
    math: {
        constants: MathConstants;
        variants: VariantsTable;
    };
    getGlyphID: (char: string) => number;
    getGlyph: (glyphID: number) => Glyph;
    getGlyphMetrics: (glyphID: number) => GlyphMetrics;
};

export type FontData = {
    font: Font;
    fontFamily: string; // e.g. "Comic Sans", "STIX2", etc.
};
