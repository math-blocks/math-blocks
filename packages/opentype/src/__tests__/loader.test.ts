import fs from 'fs';
import path from 'path';
import vm from 'vm';

import { fromBaseUrl, loadFontSubsets } from '../loader';
import { parseDirectory } from '../parser';
import { fromArrayBuffer } from '../byte-source';
import { SUBSETS } from '../test-util';

const SUBSET_DIR = path.join(SUBSETS, 'stix-two-math');

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

  test('accepts an ArrayBuffer from another realm', async () => {
    // `instanceof ArrayBuffer` is false for buffers made in another realm,
    // such as an iframe, a worker or a different test environment.
    const loader = diskLoader();
    const font = await loadFontSubsets(['calculus'], async (group) => {
      const local = new Uint8Array(await loader.load(group));
      const foreign = vm.runInNewContext(
        `new ArrayBuffer(${local.byteLength})`,
      ) as ArrayBuffer;
      expect(foreign instanceof ArrayBuffer).toBe(false);
      new Uint8Array(foreign).set(local);
      return foreign;
    });
    expect(() => font.getGlyphID('∫')).not.toThrow();
  });

  test('rejects unknown groups without loading anything', async () => {
    const loader = diskLoader();
    await expect(
      loadFontSubsets(['calculus', 'chemistry', 'music'], loader.load),
    ).rejects.toThrow('Unknown glyph groups: "chemistry", "music"');
    expect(loader.requested).toEqual([]);
  });

  test('names the subset when the loader fails', async () => {
    const offline = new Error('offline');
    const result = loadFontSubsets([], () => Promise.reject(offline));

    await expect(result).rejects.toThrow(
      'Couldn\'t load the "base" font subset: offline',
    );
    await expect(result).rejects.toHaveProperty('cause', offline);
  });

  test('names the subset when the loader throws something other than an Error', async () => {
    await expect(
      // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- this test needs a rejection that isn't an Error.
      loadFontSubsets([], () => Promise.reject('offline')),
    ).rejects.toThrow('Couldn\'t load the "base" font subset: offline');
  });

  test('names the subset that fails to parse', async () => {
    // Hides every cmap encoding record in the calculus subset, so parse
    // can't find a character map in it. The base subset is left alone.
    const loader = diskLoader();
    const load = async (group: string): Promise<ArrayBuffer> => {
      const buffer = await loader.load(group);
      if (group !== 'calculus') {
        return buffer;
      }
      const dir = await parseDirectory(fromArrayBuffer(buffer));
      const view = new DataView(buffer);
      const cmapOffset = dir.tableRecords['cmap'].offset;
      for (let i = 0; i < view.getUint16(cmapOffset + 2); i++) {
        view.setUint16(cmapOffset + 4 + i * 8, 0xffff); // platformID
      }
      return buffer;
    };

    const result = loadFontSubsets(['calculus'], load);

    await expect(result).rejects.toThrow(
      'Couldn\'t parse the "calculus" font subset: No Unicode cmap subtable.',
    );
    await expect(result).rejects.toHaveProperty(
      'cause',
      expect.objectContaining({
        message: expect.stringMatching(/^No Unicode cmap subtable\./),
      }),
    );
  });
});

describe('fromBaseUrl', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  test('fetches `${baseUrl}/${group}.otf`, ignoring trailing slashes', async () => {
    const response = { ok: true, status: 200, statusText: 'OK' };
    const fetchMock = vi.fn().mockResolvedValue(response);
    global.fetch = fetchMock;

    const load = fromBaseUrl('/fonts/stix-two-math/');
    await expect(load('calculus')).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith('/fonts/stix-two-math/calculus.otf');
  });

  test("fetches `${baseUrl}/${group}.woff` with {format: 'woff'}", async () => {
    const response = { ok: true, status: 200, statusText: 'OK' };
    const fetchMock = vi.fn().mockResolvedValue(response);
    global.fetch = fetchMock;

    const load = fromBaseUrl('/fonts/stix-two-math', { format: 'woff' });
    await expect(load('calculus')).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith(
      '/fonts/stix-two-math/calculus.woff',
    );
  });

  test("loadFontSubsets reads the .woff subsets with {format: 'woff'}", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const file = fs.readFileSync(
        path.join(SUBSET_DIR, url.replace(/^\/fonts\//, '')),
      );
      return { ok: true, arrayBuffer: async () => new Uint8Array(file).buffer };
    });

    const font = await loadFontSubsets(
      ['calculus'],
      fromBaseUrl('/fonts', { format: 'woff' }),
    );
    expect(global.fetch).toHaveBeenCalledWith('/fonts/base.woff');
    expect(global.fetch).toHaveBeenCalledWith('/fonts/calculus.woff');
    expect(font.getGlyphID('x')).toBeGreaterThan(0);
    expect(font.getGlyphID('∫')).toBeGreaterThan(0);
  });

  test('throws for a failed response', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await expect(fromBaseUrl('/fonts')('calculus')).rejects.toThrow(
      "Couldn't fetch /fonts/calculus.otf: 404 Not Found",
    );
  });

  test('loadFontSubsets names the subset that failed to fetch', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) =>
      url.endsWith('/calculus.otf')
        ? { ok: false, status: 404, statusText: 'Not Found' }
        : {
            ok: true,
            arrayBuffer: () => diskLoader().load('base'),
          },
    );

    await expect(
      loadFontSubsets(['calculus'], fromBaseUrl('/fonts')),
    ).rejects.toThrow(
      'Couldn\'t load the "calculus" font subset: ' +
        "Couldn't fetch /fonts/calculus.otf: 404 Not Found",
    );
  });
});

describe('browser builds', () => {
  test("the package doesn't import 'buffer' at runtime", async () => {
    // Bundlers replace Node's 'buffer' with a polyfill in browser builds. The
    // one the demo gets has no Blob and crashes as it loads, so the package
    // must only use 'buffer' for types.
    vi.resetModules();
    vi.doMock('buffer', () => {
      throw new Error("'buffer' was imported at runtime");
    });
    try {
      await expect(import('../index')).resolves.toBeDefined();
    } finally {
      vi.doUnmock('buffer');
      vi.resetModules();
    }
  });
});
