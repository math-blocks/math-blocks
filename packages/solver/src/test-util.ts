import { types } from '@math-blocks/semantic';
import { print as texPrint } from '@math-blocks/tex';
import { print as editorPrint } from '@math-blocks/editor';

export { parse } from './test-util/text-parser';

export const print = (node: types.Node): string => {
  return texPrint(editorPrint(node), { simpleDelimiters: true });
};
