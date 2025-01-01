import * as Semantic from '@math-blocks/semantic';
import { parse, newPrint as print } from '../test-util';

import { applyStep, applySteps } from '../apply';
import { Step } from '../types';

describe('applyStep', () => {
  test('can update root node', () => {
    const ast = parse('a');

    const step: Step = {
      message: 'test',
      before: ast,
      after: parse('b'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(print(result)).toMatchInlineSnapshot(`"b"`);
  });

  test('can update child nodes', () => {
    const ast = parse('a + b') as Semantic.types.Add;

    const step: Step = {
      message: 'test',
      before: ast.args[1],
      after: parse('c'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(print(result)).toMatchInlineSnapshot(`"a+c"`);
  });

  test('spreads add terms in parent add', () => {
    const ast = parse('a + b') as Semantic.types.Add;

    const step: Step = {
      message: 'test',
      before: ast.args[1],
      after: parse('c + d'),
      substeps: [],
    };

    const result = applyStep(ast, step);

    expect(print(result)).toMatchInlineSnapshot(`"a+c+d"`);
  });
});

describe('applySteps', () => {
  test('applies multiple steps', () => {
    const ast = parse('a + b') as Semantic.types.Add;
    const c = parse('c');
    const dPlusE = parse('d + e');

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

    expect(print(result)).toMatchInlineSnapshot(`"a+d+e"`);
  });

  test("returns the original expression when there's no steps", () => {
    const ast = parse('a + b') as Semantic.types.Add;

    const steps: Step[] = [];
    const result = applySteps(ast, steps);

    expect(print(result)).toMatchInlineSnapshot(`"a+b"`);
  });
});
