import * as Semantic from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';
import type { Step } from '../../../types';

import { distributeDiv as _distributeDiv } from '../distribute-div';

const distributeDiv = (node: Semantic.types.Node): Step => {
  if (!Semantic.util.isNumeric(node)) {
    throw new Error('node is not a NumericNode');
  }
  const result = _distributeDiv(node);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('distribute division', () => {
  test('(a + b) / c', () => {
    const ast = parse('(a + b) / c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(print(step.after)).toMatchInlineSnapshot(`"a / c + b / c"`);
    expect(step.substeps).toHaveLength(0);
  });

  test('(a - b) / c', () => {
    const ast = parse('(a - b) / c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(print(step.after)).toMatchInlineSnapshot(`"a / c - b / c"`);
    expect(step.substeps).toHaveLength(0);
  });

  test('(a + b) / -c', () => {
    const ast = parse('(a + b) / -c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(print(step.after)).toMatchInlineSnapshot(`"-(a / c) - b / c"`);
    expect(step.substeps).toHaveLength(0);
  });

  test('(a - b) / -c', () => {
    const ast = parse('(a - b) / -c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(print(step.after)).toMatchInlineSnapshot(`"-(a / c) + b / c"`);
    expect(step.substeps).toHaveLength(0);
  });
});
