import * as React from 'react';

type MissingGlyphCallback = (char: string, group: string | undefined) => void;

/**
 * Connects the typesetter's reports of missing characters to a component's
 * `onMissingGlyph` prop. There are two callbacks:
 *
 * - The one this returns, `recordMissingGlyph`, goes in the typesetting
 *   context. The typesetter calls it during render, and all it does is record
 *   the character.
 * - `onMissingGlyph`, the app's callback, is called from an effect after
 *   render with what was recorded, so it can safely update state.
 *
 * Each missing character is reported once. `onMissingGlyph` is only called
 * again when the set of missing characters changes, for example after a new
 * character is typed, so setting state in it can't cause a render loop.
 *
 * Returns undefined when there's no `onMissingGlyph`.
 */
export const useMissingGlyphs = (
  onMissingGlyph: MissingGlyphCallback | undefined,
): MissingGlyphCallback | undefined => {
  // Filled in by recordMissingGlyph during this render, read by the effect
  // after it.
  const recorded = new Map<string, readonly [string, string | undefined]>();
  const lastReported = React.useRef('');

  React.useEffect(() => {
    if (!onMissingGlyph) {
      return;
    }
    const key = [...recorded.keys()].sort().join('\u0001');
    if (key === lastReported.current) {
      return;
    }
    lastReported.current = key;
    for (const [char, group] of recorded.values()) {
      onMissingGlyph(char, group);
    }
  });

  const recordMissingGlyph: MissingGlyphCallback = (char, group) => {
    recorded.set(`${char}\u0000${group ?? ''}`, [char, group]);
  };
  return onMissingGlyph ? recordMissingGlyph : undefined;
};
