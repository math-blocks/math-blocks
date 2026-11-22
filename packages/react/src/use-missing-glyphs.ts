import * as React from 'react';

type OnMissingGlyph = (char: string, group: string | undefined) => void;

/**
 * Collects the characters the typesetter reports as missing while a
 * component renders, and passes them to `onMissingGlyph` from an effect
 * rather than during render, so the callback can safely update state.
 *
 * Each missing character is reported once. The callback is only called again
 * when the set of missing characters changes, for example after a new
 * character is typed, so setting state in it can't cause a render loop.
 *
 * Returns the function to pass as the typesetting context's
 * `onMissingGlyph`, or undefined when there's no callback.
 */
export const useMissingGlyphs = (
  onMissingGlyph: OnMissingGlyph | undefined,
): OnMissingGlyph | undefined => {
  // Filled in by the typesetter during this render, read by the effect.
  const reports = new Map<string, readonly [string, string | undefined]>();
  const lastReported = React.useRef('');

  React.useEffect(() => {
    if (!onMissingGlyph) {
      return;
    }
    const key = [...reports.keys()].sort().join('\u0001');
    if (key === lastReported.current) {
      return;
    }
    lastReported.current = key;
    for (const [char, group] of reports.values()) {
      onMissingGlyph(char, group);
    }
  });

  return onMissingGlyph
    ? (char, group): void => {
        reports.set(`${char}\u0000${group ?? ''}`, [char, group]);
      }
    : undefined;
};
