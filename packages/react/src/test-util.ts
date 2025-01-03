import { types } from '@math-blocks/semantic';
import { print as texPrint, parse as texParse } from '@math-blocks/tex';
import {
  print as editorPrint,
  parse as editorParse,
} from '@math-blocks/editor';

export const print = (node: types.Node): string => {
  return texPrint(editorPrint(node), { simpleDelimiters: true });
};

export const parse = (str: string): types.Node => {
  const row = texParse(
    str
      .replaceAll('(', '\\left(')
      .replaceAll(')', '\\right)')
      .replaceAll('-', '\u2212'),
  );
  return editorParse(row);
};
