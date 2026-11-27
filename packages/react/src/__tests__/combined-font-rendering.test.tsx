// Renders the same expressions with each original font and with all of its
// subsets combined (see @math-blocks/opentype's combineFonts), and requires the
// SVG to be identical. See https://github.com/math-blocks/math-blocks/issues/696.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { fonts } from '@math-blocks/fonts';
import {
  combineFonts,
  getFontData,
  glyphGroups,
  parse,
} from '@math-blocks/opentype';
import type { Font, FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import { expandGlyphUses } from '../test-util';

// The source fonts, and the subsets that @math-blocks/fonts ships.
const ASSETS = path.join(__dirname, '../../../../assets');
const SUBSETS = path.join(__dirname, '../../../fonts/subsets');

const FONTS = fonts.map((font) => ({
  source: font.source,
  subset: font.folder,
}));

const loadFont = (...segments: readonly string[]): Promise<Font> =>
  parse(new Blob([fs.readFileSync(path.join(...segments))]));

const hasGlyph = (font: Font, char: string): boolean => {
  try {
    font.getGlyphID(char);
    return true;
  } catch {
    return false;
  }
};

// Each content is taller than the one before, so the delimiters and radicals
// below go through a font's size variants and then its glyph assemblies.
const CONTENTS = [
  'x',
  '\\frac{a}{b}',
  '\\frac{\\frac{a}{b}}{\\frac{c}{d}}',
  '\\frac{\\frac{\\frac{a}{b}}{c}}{\\frac{d}{\\frac{e}{f}}}',
  '\\frac{\\frac{\\frac{\\frac{a}{b}}{c}}{d}}{\\frac{e}{\\frac{f}{\\frac{g}{h}}}}',
];

const DELIMITERS = [
  ['(', ')'],
  ['[', ']'],
  ['|', '|'],
  ['⌈', '⌉'],
  ['⌊', '⌋'],
  ['⟨', '⟩'],
  ['‖', '‖'],
];

const ACCENTS = ['grave', 'acute', 'hat', 'tilde', 'bar', 'dot', 'ddot', 'vec'];

const TEX_EXPRESSIONS = [
  ...DELIMITERS.flatMap(([left, right]) =>
    CONTENTS.map((content) => `\\left${left}${content}\\right${right}`),
  ),
  ...CONTENTS.map((content) => `\\sqrt{${content}}`),
  '\\sqrt[3]{x}',
  '\\sqrt[n]{\\frac{a}{b}}',
  ...ACCENTS.flatMap((accent) => [`\\${accent}{x}`, `\\${accent}{xyz}`]),
  '∑_{i=0}^{n}i',
  '∏_{k=1}^{n}k',
  '∫_0^1x',
  '∬f',
  '∮f',
  '\\lim_{x→0}f',
  'x^2+f_k^2+P_{n}^{k}',
  'e^{x^2}+a_{i_j}',
  '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
  '\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}',
  'θ+α=β',
  'x∈ℝ⇒x^2≥0',
  '‖v‖=\\sqrt{⟨v,v⟩}',
];

const render = (
  row: Editor.types.CharRow,
  fontData: FontData,
  mathStyle: Typesetter.MathStyle,
): string =>
  // The combined font gives glyphs different IDs from the original font, and
  // glyph definitions are keyed by glyph ID, so compare the outlines that each
  // <use> draws rather than the IDs it references.
  expandGlyphUses(
    ReactDOMServer.renderToStaticMarkup(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={row} mathStyle={mathStyle} />
      </FontDataContext.Provider>,
    ),
  );

describe.each(FONTS)(
  'rendering with all subsets of $source combined',
  ({ source, subset }) => {
    let original: FontData;
    let combined: FontData;

    beforeAll(async () => {
      const parts: Record<string, Font> = {};
      for (const group of glyphGroups) {
        parts[group.name] = await loadFont(
          SUBSETS,
          subset,
          `${group.name}.woff`,
        );
      }
      // The same family name for both, so only the font data differs.
      original = getFontData(await loadFont(ASSETS, source), 'test');
      combined = getFontData(combineFonts(parts), 'test');
    });

    test.each(glyphGroups)(
      'draws every character of $name like the original',
      (group) => {
        const chars = group.codePoints
          .map((cp) => String.fromCodePoint(cp))
          .filter((char) => char !== ' ' && hasGlyph(original.font, char));
        const row = Editor.builders.row(
          chars.map((char) => Editor.builders.char(char)),
        );
        expect(render(row, combined, Typesetter.MathStyle.Display)).toEqual(
          render(row, original, Typesetter.MathStyle.Display),
        );
      },
    );

    test.each(TEX_EXPRESSIONS)('renders %s like the original', (tex) => {
      const row = parseTex(tex);
      for (const mathStyle of [
        Typesetter.MathStyle.Display,
        Typesetter.MathStyle.Text,
      ]) {
        expect(render(row, combined, mathStyle)).toEqual(
          render(row, original, mathStyle),
        );
      }
    });
  },
);
