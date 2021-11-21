import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';

import type { Context, HBox } from '../types';

export const typesetMacro = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharMacro,
  context: Context,
): HBox => {
  const row = typesetChild(0, { ...context, macro: true });
  if (!row) {
    throw new Error("Delimited's content should be defined");
  }

  const { font } = context.fontData;
  const glyphID = font.getGlyphID('\\');
  const slash = Layout.makeGlyph('\\', glyphID, context, false);

  // TODO: add an outline rect that matches the size of the box
  const macro = Layout.makeStaticHBox([slash, row], context) as Mutable<HBox>;

  macro.id = node.id;
  macro.style = node.style;

  return macro;
};
