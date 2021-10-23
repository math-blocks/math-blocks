import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { applyStep, applySteps } from '../apply';
import { Step } from '../types';

describe('applyStep', () => {
  test('can update root node', () => {
    const ast = Testing.parse('a');

    const step: Step = {
      message: 'test',
      before: ast,
      after: Testing.parse('b'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(Testing.print(result)).toEqual('b');
  });

  test('can update child nodes', () => {
    const ast = Testing.parse('a + b') as Semantic.types.Add;

    const step: Step = {
      message: 'test',
      before: ast.args[1],
      after: Testing.parse('c'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(Testing.print(result)).toEqual('a + c');
  });

  test('spreads add terms in parent add', () => {
    const ast = Testing.parse('a + b') as Semantic.types.Add;

    const step: Step = {
      message: 'test',
      before: ast.args[1],
      after: Testing.parse('c + d'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(Testing.print(result)).toEqual('a + c + d');
  });
});

describe('applySteps', () => {
  test('applies multiple steps', () => {
    const ast = Testing.parse('a + b') as Semantic.types.Add;
    const c = Testing.parse('c');
    const dPlusE = Testing.parse('d + e');

    const steps: Step[] = [];
    steps.push({
      message: 'test',
      before: ast.args[1],
      after: c,
      substeps: [],
    });
    steps.push({
      message: 'test',
      before: c,
      after: dPlusE,
      substeps: [],
    });

    const result = applySteps(ast, steps);

    expect(Testing.print(result)).toEqual('a + d + e');
  });

  test("returns the original expression when there's no steps", () => {
    const ast = Testing.parse('a + b') as Semantic.types.Add;

    const steps: Step[] = [];
    const result = applySteps(ast, steps);

    expect(Testing.print(result)).toEqual('a + b');
  });
});
