import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';

import type { Context, Glyph } from '../types';

/**
 * Returns the math-italic character the typesetter draws for a Latin
 * lowercase letter a-z.
 */
export const getMathItalicChar = (char: string): string => {
  // 0x1D455 doesn't exist in the unicode standard, so we use 0x210E which
  // is the Planck constant symbol.
  // TODO: Handle other characters that are missing the from the mathematical
  // alphanumeric symbols block.  The missing symbols can be found in the
  // letter-like symbols block.  See https://www.unicode.org/charts/PDF/U2100.pdf.
  if (char === 'h') {
    return '\u210E';
  }
  const offset = char.charCodeAt(0) - 'a'.charCodeAt(0);
  return String.fromCodePoint(0x1d44e + offset);
};

export const typesetAtom = (
  node: Editor.types.CharAtom,
  context: Context,
): Glyph => {
  let glyph: Mutable<Glyph>;

  // Convert individual glyphs to italic glyphs if they exist in the
  // current font.
  if (/[a-z]/.test(node.value) && !context.operator) {
    const char = context.macro ? node.value : getMathItalicChar(node.value);
    glyph = Layout.makeGlyphForChar(char, context);
  } else {
    glyph = Layout.makeGlyphForChar(node.value, context);
  }

  glyph.id = node.id;
  glyph.style = node.style;
  glyph.pending = node.pending;
  return glyph;
};
