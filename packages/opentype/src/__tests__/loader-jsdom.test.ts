/**
 * @vitest-environment jsdom
 */
// jsdom's Blob has no arrayBuffer(), so a loader that wrapped the subsets in a
// Blob before parsing them failed in jsdom test environments.
import fs from 'fs';
import path from 'path';

import { loadFontSubsets } from '../loader';
import { SUBSETS } from '../test-util';

// WOFF tables are decompressed with DecompressionStream, so the .woff subsets
// need it to be available in jsdom test environments too.
test.each(['otf', 'woff'])(
  'loadFontSubsets works in jsdom with the .%s subsets',
  async (format) => {
    const font = await loadFontSubsets(['calculus'], async (group) => {
      const file = fs.readFileSync(
        path.join(SUBSETS, 'stix-two-math', `${group}.${format}`),
      );
      const buffer = new ArrayBuffer(file.byteLength);
      new Uint8Array(buffer).set(file);
      return buffer;
    });
    expect(font.getGlyphID('x')).toBeGreaterThan(0);
    expect(font.getGlyphID('∫')).toBeGreaterThan(0);
  },
);
