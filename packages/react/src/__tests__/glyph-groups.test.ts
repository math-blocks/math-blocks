// Checks that every character math-blocks can render belongs to one of the
// font subset groups in @math-blocks/opentype, so a new macro or symbol can't
// silently fall outside the subsets. See
// https://github.com/math-blocks/math-blocks/issues/696.
import { glyphGroups } from '@math-blocks/opentype';
import { macros } from '@math-blocks/tex';

const grouped = new Set(glyphGroups.flatMap((group) => group.codePoints));

const hex = (codePoint: number): string =>
  'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');

const ungrouped = (chars: Iterable<string>): string[] =>
  [...new Set(chars)]
    .map((char) => char.codePointAt(0) as number)
    .filter((cp) => !grouped.has(cp))
    .map(hex);

describe('glyph groups', () => {
  test('cover every character a TeX macro inserts', () => {
    // Multi-character values like 'log' are typeset from ASCII letters.
    const chars = Object.values(macros).flatMap((value) => [...value]);
    expect(ungrouped(chars)).toEqual([]);
  });

  test('cover every character that can be typed on a keyboard', () => {
    const ascii = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) =>
      String.fromCharCode(0x20 + i),
    );
    expect(ungrouped(ascii)).toEqual([]);
  });

  test('cover the characters the typesetter substitutes', () => {
    const chars = [
      '−', // minus sign, inserted for '-'
      'ℎ', // planck constant, the math-italic 'h'
      '̅', // combining overline, used for the bar accent
      // math-italic a-z, except U+1D455 which Unicode leaves unassigned
      ...Array.from({ length: 26 }, (_, i) => 0x1d44e + i)
        .filter((cp) => cp !== 0x1d455)
        .map((cp) => String.fromCodePoint(cp)),
    ];
    expect(ungrouped(chars)).toEqual([]);
  });
});
