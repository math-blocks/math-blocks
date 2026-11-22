/**
 * @vitest-environment jsdom
 */
// jsdom's Blob has no arrayBuffer(), so a loader that wrapped the subsets in a
// Blob before parsing them failed in jsdom test environments.
import fs from 'fs';
import path from 'path';

import { loadFontSubsets } from '../loader';
import { ASSETS } from '../test-util';

test('loadFontSubsets works in jsdom', async () => {
  const font = await loadFontSubsets(['calculus'], async (group) => {
    const file = fs.readFileSync(
      path.join(ASSETS, 'subsets', 'stix-two-math', `${group}.otf`),
    );
    const buffer = new ArrayBuffer(file.byteLength);
    new Uint8Array(buffer).set(file);
    return buffer;
  });
  expect(font.getGlyphID('x')).toBeGreaterThan(0);
  expect(font.getGlyphID('∫')).toBeGreaterThan(0);
});
