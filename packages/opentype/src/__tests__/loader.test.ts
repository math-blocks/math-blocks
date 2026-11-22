import fs from 'fs';
import path from 'path';

import { fromBaseUrl, loadFontSubsets } from '../loader';
import { ASSETS } from '../test-util';

const SUBSET_DIR = path.join(ASSETS, 'subsets', 'stix-two-math');

// Reads subset files from disk, recording which groups were requested.
const diskLoader = (): {
  readonly requested: string[];
  readonly load: (group: string) => Promise<ArrayBuffer>;
} => {
  const requested: string[] = [];
  return {
    requested,
    load: async (group) => {
      requested.push(group);
      const file = fs.readFileSync(path.join(SUBSET_DIR, `${group}.otf`));
      const buffer = new ArrayBuffer(file.byteLength);
      new Uint8Array(buffer).set(file);
      return buffer;
    },
  };
};

describe('loadFontSubsets', () => {
  test('always loads the base group', async () => {
    const loader = diskLoader();
    const font = await loadFontSubsets(['calculus'], loader.load);
    expect(loader.requested.sort()).toEqual(['base', 'calculus']);
    expect(font.loadedGroups).toEqual(['base', 'calculus']);
    expect(() => font.getGlyphID('∫')).not.toThrow();
    expect(() => font.getGlyphID('x')).not.toThrow();
  });

  test('loads base alone when given no groups', async () => {
    const loader = diskLoader();
    const font = await loadFontSubsets([], loader.load);
    expect(loader.requested).toEqual(['base']);
    expect(font.loadedGroups).toEqual(['base']);
  });

  test('loads each group once', async () => {
    const loader = diskLoader();
    await loadFontSubsets(['base', 'calculus', 'calculus'], loader.load);
    expect(loader.requested.sort()).toEqual(['base', 'calculus']);
  });

  test('accepts anything with an arrayBuffer() method', async () => {
    const loader = diskLoader();
    const font = await loadFontSubsets(['sets-logic'], (group) =>
      Promise.resolve({ arrayBuffer: () => loader.load(group) }),
    );
    expect(() => font.getGlyphID('∈')).not.toThrow();
  });

  test('rejects unknown groups without loading anything', async () => {
    const loader = diskLoader();
    await expect(
      loadFontSubsets(['calculus', 'chemistry', 'music'], loader.load),
    ).rejects.toThrow('Unknown glyph groups: "chemistry", "music"');
    expect(loader.requested).toEqual([]);
  });

  test('passes on errors from the loader', async () => {
    await expect(
      loadFontSubsets([], () => Promise.reject(new Error('offline'))),
    ).rejects.toThrow('offline');
  });
});

describe('fromBaseUrl', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  test('fetches `${baseUrl}/${group}.otf`, ignoring trailing slashes', async () => {
    const response = { ok: true, status: 200, statusText: 'OK' };
    const fetchMock = jest.fn().mockResolvedValue(response);
    global.fetch = fetchMock;

    const load = fromBaseUrl('/fonts/stix-two-math/');
    await expect(load('calculus')).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith('/fonts/stix-two-math/calculus.otf');
  });

  test('throws for a failed response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await expect(fromBaseUrl('/fonts')('calculus')).rejects.toThrow(
      'Couldn\'t load the "calculus" font subset from /fonts/calculus.otf: 404 Not Found',
    );
  });
});
