import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';

import type { Context, HBox, Glyph, Node } from '../types';

const canBeUnary = (char: string): boolean => {
  const unaryOperators = [
    '+',
    '\u2212', // \minus
    '\u00B1', // \pm
  ];

  return unaryOperators.includes(char);
};

const shouldHavePadding = (
  prevNode: Editor.types.CharNode | Editor.Focus | undefined,
  currentNode: Editor.types.CharAtom,
  context: Context,
): boolean => {
  const currentChar = currentNode.value;

  // We only add padding around operators, so if we get a non-operator char
  // we can return early.
  if (!Editor.util.isOperator(currentNode)) {
    return false;
  }

  // No operators get padding when `cramped` is true
  if (context.cramped) {
    return false;
  }

  // If the currentChar can be unary we check a number of situations where it
  // should be unary and don't give it any padding in those situations.
  if (canBeUnary(currentChar)) {
    if (
      !prevNode ||
      (prevNode.type === 'char' && Editor.util.isOperator(prevNode)) ||
      prevNode.type === 'limits' ||
      prevNode.type === 'zlimits'
    ) {
      return false;
    }
  }

  // All other operators should have padding around them.
  return true;
};

export const maybeAddOperatorPadding = (
  prevNode: Editor.types.CharNode | Editor.Focus | undefined,
  currentNode: Editor.types.CharAtom,
  context: Context,
  padOperator?: boolean,
): Node => {
  const glyph = typesetAtom(currentNode, context) as Mutable<Glyph>;
  const fontSize = Layout.fontSizeForContext(context);
  const result =
    (padOperator && Editor.util.isOperator(currentNode)) ||
    shouldHavePadding(prevNode, currentNode, context)
      ? (Layout.makeStaticHBox(
          [Layout.makeKern(fontSize / 4), glyph, Layout.makeKern(fontSize / 4)],
          context,
        ) as Mutable<HBox>)
      : glyph;
  if (result !== glyph) {
    result.id = glyph.id;
    delete glyph.id;
    // Move the style to the result so that cancel overlays are
    // continuous even when they include an operator with padding.
    result.style = glyph.style;
    glyph.style = {};
  }
  return result;
};

export const typesetAtom = (
  node: Editor.types.CharAtom,
  context: Context,
): Glyph => {
  const { font } = context.fontData;

  const glyphID = font.getGlyphID(node.value);
  let glyph = Layout.makeGlyph(node.value, glyphID, context) as Mutable<Glyph>;

  // Convert individual glyphs to italic glyphs if they exist in the
  // current font.
  if (/[a-z]/.test(node.value) && !context.operator) {
    const offset = node.value.charCodeAt(0) - 'a'.charCodeAt(0);
    const char = context.macro
      ? node.value
      : String.fromCodePoint(0x1d44e + offset);
    const glyphID = font.getGlyphID(char);
    glyph = Layout.makeGlyph(char, glyphID, context);
  }

  glyph.id = node.id;
  glyph.style = node.style;
  glyph.pending = node.pending;
  return glyph;
};
