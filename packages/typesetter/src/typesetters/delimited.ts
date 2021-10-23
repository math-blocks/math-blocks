import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';

import type { Context, HBox, Glyph } from '../types';

export const typesetDelimited = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharDelimited | Editor.ZDelimited,
  context: Context,
): HBox => {
  const thresholdOptions = {
    value: 'both' as const,
    strict: true,
  };

  const row = typesetChild(0, context);
  if (!row) {
    throw new Error("Delimited's content should be defined");
  }

  const open = Layout.makeDelimiter(
    node.leftDelim.value,
    row,
    thresholdOptions,
    context,
  ) as Mutable<Glyph>;

  const close = Layout.makeDelimiter(
    node.rightDelim.value,
    row,
    thresholdOptions,
    context,
  ) as Mutable<Glyph>;

  open.pending = node.leftDelim.pending;
  close.pending = node.rightDelim.pending;

  const delimited = Layout.makeStaticHBox(
    [open, row, close],
    context,
  ) as Mutable<HBox>;

  delimited.id = node.id;
  delimited.style = node.style;

  return delimited;
};
