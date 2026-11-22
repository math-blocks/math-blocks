import { Blob } from 'buffer';

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

const toArrayBuffer = async (data: FontFileData): Promise<ArrayBuffer> =>
  data instanceof ArrayBuffer ? data : data.arrayBuffer();

/**
 * Loads the font subsets for the given glyph groups and combines them into a
 * CombinedFont. The "base" group is always loaded, whether or not it's listed.
 * Groups are loaded in parallel.
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
      const buffer = await toArrayBuffer(await loadGroup(name));
      return [name, await parse(new Blob([buffer]))];
    }),
  );
  return combineFonts(Object.fromEntries(fonts));
};

/**
 * Returns a LoadGroup that fetches `${baseUrl}/${group}.otf`, for subsets
 * hosted in one folder, such as a copy of `assets/subsets/stix-two-math/`.
 */
export const fromBaseUrl = (baseUrl: string): LoadGroup => {
  const base = baseUrl.replace(/\/+$/, '');
  return async (group) => {
    const url = `${base}/${group}.otf`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Couldn't load the "${group}" font subset from ${url}: ` +
          `${response.status} ${response.statusText}`,
      );
    }
    return response;
  };
};
