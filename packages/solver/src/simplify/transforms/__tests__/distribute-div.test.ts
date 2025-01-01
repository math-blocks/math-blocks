import * as Semantic from '@math-blocks/semantic';

import * as Testing from '../../../test-util';
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
    const ast = Testing.parse('(a + b) / c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(Testing.print(step.after)).toEqual('a / c + b / c');
    expect(step.substeps.map((substep) => substep.message)).toEqual([]);
  });

  test('(a - b) / c', () => {
    const ast = Testing.parse('(a - b) / c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(Testing.print(step.after)).toEqual('a / c - b / c');
    expect(step.substeps.map((substep) => substep.message)).toEqual([]);
  });

  test('(a + b) / -c', () => {
    const ast = Testing.parse('(a + b) / -c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(Testing.print(step.after)).toEqual('-(a / c) - b / c');
    expect(step.substeps.map((substep) => substep.message)).toEqual([]);
  });

  test('(a - b) / -c', () => {
    const ast = Testing.parse('(a - b) / -c');

    const step = distributeDiv(ast);

    expect(step.message).toEqual('distribute division');
    expect(Testing.print(step.after)).toEqual('-(a / c) + b / c');
    expect(step.substeps.map((substep) => substep.message)).toEqual([]);
  });
});
