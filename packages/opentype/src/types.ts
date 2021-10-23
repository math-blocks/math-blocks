import type { HeaderTable } from './tables/head';
import type { MathTable } from './tables/math';
import type { Glyph, TopDict } from './tables/cff-types';

export type TableRecord = {
  readonly tableTag: string; // 4 bytes
  readonly checksum: number; // uint32
  readonly offset: number; // uint32
  readonly length: number; // uint32
};

export type TableDirectory = {
  readonly sfntVersion: string; // 4 bytes
  readonly numTables: number; // uint16
  readonly searchRange: number; // uint16
  readonly entrySelector: number; // uint16
  readonly rangeShift: number; // uint16
  readonly tableRecords: Record<string, TableRecord>;
};

export type GlyphMetrics = {
  readonly advance: number;
  readonly bearingX: number;
  readonly bearingY: number;
  readonly width: number;
  readonly height: number;
};

export type Font = {
  readonly cff: {
    readonly name: string;
    readonly topDict: TopDict;
  };
  readonly head: HeaderTable;
  readonly math: MathTable;
  readonly getGlyphID: (char: string) => number;
  readonly getGlyph: (glyphID: number) => Glyph;
  readonly getGlyphMetrics: (glyphID: number) => GlyphMetrics;
};

export type FontData = {
  readonly font: Font;
  readonly fontFamily: string; // e.g. "Comic Sans", "STIX2", etc.
};
