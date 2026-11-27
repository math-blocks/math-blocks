import { combineFonts } from './combined-font';
import { glyphGroups } from './glyph-groups';
import { parse } from './parser';

import type { CombinedFont } from './combined-font';
import type { Font } from './types';

/**
 * The contents of a font file: an ArrayBuffer, or anything with an
 * `arrayBuffer()` method, such as a Blob or a fetch Response.
 */
export type FontFileData =
  | ArrayBuffer
  | { readonly arrayBuffer: () => Promise<ArrayBuffer> };

/** Returns the contents of the subset file for a glyph group. */
export type LoadGroup = (group: string) => Promise<FontFileData>;

// Checks for an arrayBuffer() method rather than using `instanceof
// ArrayBuffer`, which fails for an ArrayBuffer from another realm (an iframe,
// a worker, or a different test environment).
const toArrayBuffer = async (data: FontFileData): Promise<ArrayBuffer> =>
  'arrayBuffer' in data && typeof data.arrayBuffer === 'function'
    ? data.arrayBuffer()
    : (data as ArrayBuffer);

// Wraps an error from loading or parsing a subset so that its message names
// the subset. The original error is kept as `cause`.
const subsetError = (
  step: 'load' | 'parse',
  group: string,
  error: unknown,
): Error => {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Couldn't ${step} the "${group}" font subset: ${message}`, {
    cause: error,
  });
};

/**
 * Loads the font subsets for the given glyph groups and combines them into a
 * CombinedFont. The "base" group is always loaded, whether or not it's listed.
 * Groups are loaded in parallel.
 *
 * If a subset fails to load or parse, the returned promise rejects with an
 * error whose message names the subset, such as `Couldn't parse the
 * "calculus" font subset: …`. The original error is its `cause`.
 *
 * `loadGroup` fetches a group's subset file. This function doesn't do any
 * networking itself; use `fromBaseUrl` for subsets hosted in one folder, or
 * pass your own function to load them from anywhere else.
 *
 * @example
 * const font = await loadFontSubsets(
 *   ['calculus'],
 *   fromBaseUrl('/fonts/stix-two-math'),
 * );
 */
export const loadFontSubsets = async (
  groups: readonly string[],
  loadGroup: LoadGroup,
): Promise<CombinedFont> => {
  const known = new Set(glyphGroups.map((group) => group.name));
  const unknown = groups.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown glyph group${unknown.length > 1 ? 's' : ''}: ${unknown
        .map((name) => `"${name}"`)
        .join(', ')}`,
    );
  }

  const names = [...new Set([glyphGroups[0].name, ...groups])];
  const fonts = await Promise.all(
    names.map(async (name): Promise<[string, Font]> => {
      let buffer: ArrayBuffer;
      try {
        buffer = await toArrayBuffer(await loadGroup(name));
      } catch (error) {
        throw subsetError('load', name, error);
      }
      try {
        return [name, await parse(buffer)];
      } catch (error) {
        throw subsetError('parse', name, error);
      }
    }),
  );
  return combineFonts(Object.fromEntries(fonts));
};

/** The file formats that the font subsets are published in. */
export type FontFormat = 'otf' | 'woff';

export type FromBaseUrlOptions = {
  /**
   * Which file to fetch for each subset: `'woff'` (the default) for WOFF, or
   * `'otf'` for raw OpenType. WOFF files are smaller to download, but need
   * `DecompressionStream`, which current browsers and Node 18+ have.
   */
  readonly format?: FontFormat;
};

/**
 * Returns a LoadGroup that fetches `${baseUrl}/${group}.woff`, for subsets
 * hosted in one folder, such as a copy of the `subsets/stix-two-math/` folder
 * of `@math-blocks/fonts`.
 * Pass `{format: 'otf'}` to fetch `${baseUrl}/${group}.otf` instead.
 */
export const fromBaseUrl = (
  baseUrl: string,
  options: FromBaseUrlOptions = {},
): LoadGroup => {
  const base = baseUrl.replace(/\/+$/, '');
  const format = options.format ?? 'woff';
  return async (group) => {
    const url = `${base}/${group}.${format}`;
    const response = await fetch(url);
    if (!response.ok) {
      // loadFontSubsets adds the subset's name to the message.
      throw new Error(
        `Couldn't fetch ${url}: ${response.status} ${response.statusText}`,
      );
    }
    return response;
  };
};
