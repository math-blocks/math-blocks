import { builders, types } from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';
import type { Step } from '../../../types';

import { moveTermsToOneSide } from '../move-terms-to-one-side';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

const transform = (node: types.NumericRelation): Step => {
  const ident = builders.identifier('x');
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

    expect(print(step.after)).toMatchInlineSnapshot(`"2x = 5"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "5",
      ]
    `);
  });

  test('2x - 5 = 10', () => {
    const before = parseNumRel('2x - 5 = 10');

    const step = transform(before);

    expect(print(step.after)).toMatchInlineSnapshot(`"2x = 15"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['add']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "5",
      ]
    `);
  });

  test('2x + -5 = 10', () => {
    const before = parseNumRel('2x + -5 = 10');

    const step = transform(before);

    expect(print(step.after)).toMatchInlineSnapshot(`"2x = 15"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "-5",
      ]
    `);
  });

  // TODO: Only move `+ 5` to the left side
  test('10 = 2x + 5', () => {
    const before = parseNumRel('10 = 2x + 5');

    const step = transform(before);

    expect(print(step.after)).toMatchInlineSnapshot(`"5 = 2x"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "5",
      ]
    `);
  });

  test('10 = 2x - 5', () => {
    const before = parseNumRel('10 = 2x - 5');

    const step = transform(before);

    expect(print(step.after)).toMatchInlineSnapshot(`"15 = 2x"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['add']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "5",
      ]
    `);
  });

  test('10 = 2x + -5', () => {
    const before = parseNumRel('10 = 2x + -5');

    const step = transform(before);

    expect(print(step.after)).toMatchInlineSnapshot(`"15 = 2x"`);
    const doSameOpSteps = step.substeps[0].substeps.filter(
      (step) => step.message === 'do the same operation to both sides',
    );
    const operations = doSameOpSteps.map((step) => step.operation);
    expect(operations).toEqual(['sub']);
    const terms = doSameOpSteps.map((step) => print(step.value));
    expect(terms).toMatchInlineSnapshot(`
      [
        "-5",
      ]
    `);
  });
});
