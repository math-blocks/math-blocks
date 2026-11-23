import * as React from 'react';

import {
  getFontData,
  glyphGroups,
  loadFontSubsets,
} from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';

// The URL of every subset in assets/subsets/, keyed by "<folder>/<group>".
// Vite copies the files into the build, so this works with `pnpm start` and in
// the deployed demo.
const subsetUrls: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../../assets/subsets/*/*.otf', {
      query: '?url',
      import: 'default',
      eager: true,
    }),
  ).map(([path, url]) => [path.replace(/^.*\/subsets\/(.*)\.otf$/, '$1'), url]),
);

export const FONTS = [
  { name: 'STIX Two Math', folder: 'stix-two-math' },
  { name: 'Latin Modern Math', folder: 'latin-modern-math' },
  { name: 'TeX Gyre Bonum Math', folder: 'tex-gyre-bonum-math' },
  { name: 'TeX Gyre Pagella Math', folder: 'tex-gyre-pagella-math' },
  { name: 'TeX Gyre Schola Math', folder: 'tex-gyre-schola-math' },
  { name: 'TeX Gyre Termes Math', folder: 'tex-gyre-termes-math' },
] as const;

export type FontFolder = (typeof FONTS)[number]['folder'];

const ALL_GROUPS = glyphGroups.map((group) => group.name);

const loadSubset = async (
  folder: FontFolder,
  group: string,
): Promise<Response> => {
  const url = subsetUrls[`${folder}/${group}`];
  if (!url) {
    // loadFontSubsets adds the subset's name to these messages.
    throw new Error(`Not found in assets/subsets/${folder}/`);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Couldn't fetch ${url}: ${response.status}`);
  }
  return response;
};

// One load per font, shared by every page that uses it.
const cache = new Map<FontFolder, Promise<FontData>>();

/** Loads every glyph group of a font's subsets, once. */
export const loadFont = (folder: FontFolder): Promise<FontData> => {
  let fontData = cache.get(folder);
  if (!fontData) {
    fontData = loadFontSubsets(ALL_GROUPS, (group) =>
      loadSubset(folder, group),
    ).then(
      (font) => getFontData(font, folder),
      (error) => {
        // Forget the failure, so the next attempt fetches the font again.
        cache.delete(folder);
        throw error;
      },
    );
    cache.set(folder, fontData);
  }
  return fontData;
};

/**
 * Returns the font's data once it's loaded, and null until then. Only the
 * font that's asked for is loaded. If it fails to load, this throws the error
 * while rendering, so the router's error page shows it instead of the page
 * staying blank.
 */
export const useFont = (folder: FontFolder): FontData | null => {
  const [fontData, setFontData] = React.useState<FontData | null>(null);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadFont(folder).then(
      (loaded) => {
        if (!cancelled) {
          setFontData(loaded);
        }
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setError(loadError);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [folder]);

  if (error) {
    // oxlint-disable-next-line typescript/only-throw-error -- rethrows whatever loadFont() rejected with, so an error boundary sees it.
    throw error;
  }

  // While another font loads, this is still the previous one, so the page
  // doesn't go blank when switching fonts.
  return fontData;
};
