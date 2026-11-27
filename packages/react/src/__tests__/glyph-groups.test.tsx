// Checks that every character math-blocks can render belongs to one of the
// font subset groups in @math-blocks/opentype, so a new macro or symbol can't
// silently fall outside the subsets. See
// https://github.com/math-blocks/math-blocks/issues/696.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Blob } from 'buffer';

import {
  combineFonts,
  getFontData,
  glyphGroups,
  parse,
} from '@math-blocks/opentype';
import type { Font } from '@math-blocks/opentype';
import { macros, parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

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

// Loading exactly the groups glyphGroupsForRow asks for must be enough to
// render an expression, so the typesetter never draws a character that
// glyphGroupsForRow doesn't know about. Rendering throws a
// GlyphGroupNotLoadedError for a character whose group isn't loaded.
describe('glyphGroupsForRow', () => {
  const loadSubset = (group: string): Promise<Font> =>
    parse(
      new Blob([
        fs.readFileSync(
          path.join(
            __dirname,
            '../../../fonts/subsets/stix-two-math',
            `${group}.woff`,
          ),
        ),
      ]),
    );

  test.each([
    'θ+\\sqrt{x^2+1}',
    '\\hat{x}+\\vec{v}+\\bar{y}+\\tilde{n}+\\dot{a}+\\ddot{b}',
    '∑_{i=0}^{n}i+∫_0^1x',
    '\\lim_{x→0}f',
    '\\left⟨u,v\\right⟩+\\left‖v\\right‖',
    '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}',
    'x∈ℝ⇒x^2≥0',
  ])('lists every group needed to render %s', async (tex) => {
    const row = parseTex(tex);
    const groups = Typesetter.glyphGroupsForRow(row);
    const parts: Record<string, Font> = {};
    for (const group of ['base', ...groups]) {
      parts[group] = await loadSubset(group);
    }
    const fontData = getFontData(combineFonts(parts), 'STIX2');
    for (const mathStyle of [
      Typesetter.MathStyle.Display,
      Typesetter.MathStyle.Text,
    ]) {
      expect(() =>
        ReactDOMServer.renderToStaticMarkup(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer row={row} mathStyle={mathStyle} />
          </FontDataContext.Provider>,
        ),
      ).not.toThrow();
    }
  });
});
