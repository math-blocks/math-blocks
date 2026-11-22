import * as Editor from '@math-blocks/editor';

import { glyphGroupsForRow } from '../glyph-groups';

const b = Editor.builders;
const chars = (text: string): Editor.types.CharAtom[] =>
  [...text].map((c) => b.char(c));

describe('glyphGroupsForRow', () => {
  test('arithmetic and algebra only need the base group', () => {
    expect(glyphGroupsForRow(b.row(chars('3x+2=11')))).toEqual(['base']);
    expect(
      glyphGroupsForRow(b.row([b.frac(chars('a+1'), chars('b'))])),
    ).toEqual(['base']);
  });

  test('finds characters in nested structures', () => {
    const row = b.row([
      b.frac(chars('1'), [b.root(null, chars('θ'))]),
      b.subsup(chars('i'), [b.delimited(chars('x'), b.char('⟨'), b.char('⟩'))]),
    ]);
    expect(glyphGroupsForRow(row)).toEqual([
      'base',
      'trig-geometry',
      'linear-algebra',
    ]);
  });

  test("includes a limits node's operator", () => {
    const row = b.row([b.limits(b.char('∑'), chars('i=0'), chars('n'))]);
    expect(glyphGroupsForRow(row)).toEqual(['base', 'calculus']);
  });

  test('includes delimiters of delimited nodes and tables', () => {
    expect(
      glyphGroupsForRow(
        b.row([b.delimited(chars('v'), b.char('‖'), b.char('‖'))]),
      ),
    ).toEqual(['base', 'linear-algebra']);
    expect(
      glyphGroupsForRow(
        b.row([
          b.matrix([b.row(chars('a')), b.row(chars('b'))], 1, 2, {
            left: b.char('⟨'),
            right: b.char('⟩'),
          }),
        ]),
      ),
    ).toEqual(['base', 'linear-algebra']);
  });

  test('handles empty subscripts and table cells', () => {
    const row = b.row([
      b.subsup(undefined, chars('2')),
      b.table([b.row(chars('∈')), null], 2, 1),
    ]);
    expect(glyphGroupsForRow(row)).toEqual(['base', 'sets-logic']);
  });

  test('includes the backslash drawn for a macro being typed', () => {
    // The backslash is in the base group; the macro's letters are upright.
    expect(glyphGroupsForRow(b.row([b.macro(chars('alpha'))]))).toEqual([
      'base',
    ]);
  });

  test('ignores characters that are in no group', () => {
    expect(glyphGroupsForRow(b.row(chars('😀')))).toEqual([]);
  });
});
