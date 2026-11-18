import { types } from '@math-blocks/semantic';
import { print as texPrint, parse as texParse } from '@math-blocks/tex';
import {
  print as editorPrint,
  parse as editorParse,
} from '@math-blocks/editor';

import { applyStep } from './apply';
import type { Step } from './types';

export const print = (node: types.Node): string => {
  return texPrint(editorPrint(node), { simpleDelimiters: true });
};

export const parse = (str: string): types.Node => {
  const row = texParse(
    str
      .replaceAll('(', '\\left(')
      .replaceAll(')', '\\right)')
      .replaceAll('-', '−'),
  );
  return editorParse(row);
};

/**
 * Applies `steps` to `node` one at a time and prints the whole expression
 * after each one, followed by the step's message.  The first line is `node`
 * itself.  Use it to check a sequence of steps with a single snapshot, e.g.
 *
 *   expect(printSteps(ast, step.substeps)).toMatchInlineSnapshot();
 *
 * Steps are applied with `applyStep` rather than read from `step.after`, so a
 * step that only rewrites part of the expression still prints the whole
 * expression, and a step that can't be applied shows up in the snapshot.
 */
export const printSteps = (
  node: types.Node,
  steps: readonly Step[],
): string[] => {
  let current = node;
  return [
    print(node),
    ...steps.map((step) => {
      current = applyStep(current, step);
      return `${print(current)} - ${step.message}`;
    }),
  ];
};
