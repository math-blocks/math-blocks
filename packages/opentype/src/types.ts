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

type Command =
    | {
          type: "M";
          x: number;
          y: number;
      }
    | {
          type: "L";
          x: number;
          y: number;
      }
    | {
          type: "Q";
          x1: number;
          y1: number;
          x: number;
          y: number;
      }
    | {
          type: "C";
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          x: number;
          y: number;
      }
    | {
          type: "Z";
      };

export type Path = Command[];

export type GlyphData = {
    path: Path;
    advanceWidth: number;
};

type Metrics = {
    advance: number;
};

export type Glyph = {
    path: Path;
    metrics: Metrics;
    name: string;
};

export type GlyphMetrics = {
    advance: number;
    bearingX: number;
    bearingY: number;
    width: number;
    height: number;
};

export type FontMetrics = {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    getGlyphMetrics: (codePoint: number | undefined) => GlyphMetrics | null;
    hasChar: (char: string) => boolean;
};

export type FontData = {
    fontMetrics: FontMetrics;
    fontFamily: string; // e.g. "Comic Sans", "STIX2", etc.
};
