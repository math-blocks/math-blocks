import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { moveTermsToOneSide } from '../move-terms-to-one-side';

import type { Step } from '../../../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const transform = (node: Semantic.types.NumericRelation): Step => {
  const ident = Semantic.builders.identifier('x');
  const result = moveTermsToOneSide(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('move constants from left to right', () => {
  test('2x + 5 = 10', () => {
    const before = parseNumRel('2x + 5 = 10');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('2x = 5');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['5']);
  });

  test('2x - 5 = 10', () => {
    const before = parseNumRel('2x - 5 = 10');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('2x = 15');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['add']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['5']);
  });

  test('2x + -5 = 10', () => {
    const before = parseNumRel('2x + -5 = 10');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('2x = 15');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['-5']);
  });

  // TODO: Only move `+ 5` to the left side
  test('10 = 2x + 5', () => {
    const before = parseNumRel('10 = 2x + 5');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('5 = 2x');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['5']);
  });

  test('10 = 2x - 5', () => {
    const before = parseNumRel('10 = 2x - 5');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('15 = 2x');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['add']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['5']);
  });

  test('10 = 2x + -5', () => {
    const before = parseNumRel('10 = 2x + -5');

    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('15 = 2x');
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => Testing.print(step.value));
    expect(terms).toEqual(['-5']);
  });
});
