import { fromArrayBuffer } from './byte-source';
import type { ByteSource } from './byte-source';

import { GlyphNotFoundError } from './errors';

import { parseCFF } from './tables/cff';
import { parseCmap } from './tables/cmap';
import { parseMATH } from './tables/math';
import { parseHead } from './tables/head';

import { getGlyphMetrics } from './util';
import { isWoff, woffToSfnt } from './woff';

import type { Font, GlyphMetrics, TableRecord, TableDirectory } from './types';

const parseTag = (view: DataView, offset = 0): string => {
  return [
    view.getUint8(offset + 0),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  ]
    .map((x) => String.fromCharCode(x))
    .join('');
};

const parseTableRecords = async (
  blob: ByteSource,
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

export const parseDirectory = async (
  blob: ByteSource,
): Promise<TableDirectory> => {
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

// Returns the sfnt data to parse. A WOFF file is decompressed into the sfnt
// file it was made from; anything else is returned as is.
const toSfnt = async (blob: ByteSource): Promise<ByteSource> => {
  if (!isWoff(await blob.slice(0, 4).arrayBuffer())) {
    return blob;
  }
  return fromArrayBuffer(await woffToSfnt(await blob.arrayBuffer()));
};

/**
 * Parses an OpenType font with a MATH table and CFF outlines. `data` is the
 * font file, as raw OpenType (.otf) or WOFF 1.0 (.woff): a Blob, or an
 * ArrayBuffer.
 *
 * WOFF tables are decompressed with `DecompressionStream`, which browsers and
 * Node 18+ provide.
 */
export const parse = async (data: ByteSource | ArrayBuffer): Promise<Font> => {
  // Checks for arrayBuffer() rather than using `instanceof ArrayBuffer`, which
  // fails for an ArrayBuffer from another realm (an iframe, a worker, or a
  // different test environment).
  const blob = await toSfnt(
    'arrayBuffer' in data && typeof data.arrayBuffer === 'function'
      ? data
      : fromArrayBuffer(data as ArrayBuffer),
  );
  const dir = await parseDirectory(blob);

  const headTableRecord = dir.tableRecords['head'];
  if (!headTableRecord) {
    throw new Error("No TableRecord for 'head' table");
  }
  const headBlob = blob.slice(
    headTableRecord.offset,
    headTableRecord.offset + headTableRecord.length,
  );
  const head = await parseHead(headBlob);

  // TODO: move the blob for each table record into the parseDirector result
  const cmapTableRecord = dir.tableRecords['cmap'];
  if (!cmapTableRecord) {
    throw new Error("No TableRecord for 'cmap' table");
  }
  const cmapBlob = blob.slice(
    cmapTableRecord.offset,
    cmapTableRecord.offset + cmapTableRecord.length,
  );
  const glyphIndexMap = await parseCmap(cmapBlob);

  const mathTableRecord = dir.tableRecords['MATH'];
  if (!mathTableRecord) {
    throw new Error("No TableRecord for 'MATH' table");
  }
  const mathBlob = blob.slice(
    mathTableRecord.offset,
    mathTableRecord.offset + mathTableRecord.length,
  );
  const math = await parseMATH(mathBlob, head.unitsPerEm);

  const cffTableRecord = dir.tableRecords['CFF '];
  if (!cffTableRecord) {
    throw new Error("No TableRecord for 'CFF ' table");
  }
  const cffBlob = blob.slice(
    cffTableRecord.offset,
    cffTableRecord.offset + cffTableRecord.length,
  );
  const cff = await parseCFF(cffBlob);

  // The typesetter asks for the same glyphs' metrics many times per render,
  // and working them out means scanning the glyph's whole outline, so keep
  // them. getGlyph already caches the glyphs themselves.
  const metricsCache = new Map<number, GlyphMetrics>();

  const font: Font = {
    cff: {
      name: cff.name,
      topDict: cff.topDict,
    },
    head,
    math,
    getGlyph: cff.getGlyph,
    getGlyphID: (char: string): number => {
      const codePoint = char.codePointAt(0);
      if (!codePoint) {
        throw new Error(`Invalid char: ${char}`);
      }
      const glyphID = glyphIndexMap[codePoint];
      if (!glyphID) {
        throw new GlyphNotFoundError(codePoint);
      }
      return glyphID;
    },
    getGlyphMetrics: (gid: number): GlyphMetrics => {
      let metrics = metricsCache.get(gid);
      if (!metrics) {
        metrics = getGlyphMetrics(cff.getGlyph(gid));
        metricsCache.set(gid, metrics);
      }
      return metrics;
    },
  };

  return font;
};
