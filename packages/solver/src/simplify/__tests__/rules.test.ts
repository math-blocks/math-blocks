import * as Semantic from '@math-blocks/semantic';

import type { Step, Transform } from '../../types';
import { parse, print } from '../../test-util';
import { fromRule, rootContext, run } from '../../rewrite/trace';
import type { Context, Rule } from '../../rewrite/types';

import { simplify, simplifyTransforms } from '../simplify';
import { addNegToSub } from '../transforms/add-neg-to-sub';
import { dropParens } from '../transforms/drop-parens';
import { dropAddIdentity } from '../transforms/drop-add-identity';
import { evalMul, evalAdd, evalDiv } from '../transforms/eval';
import { collectLikeTerms } from '../transforms/collect-like-terms';
import { distribute } from '../transforms/distribute';
import { distributeDiv } from '../transforms/distribute-div';
import { reduceFraction } from '../transforms/reduce-fraction';
import { mulFraction } from '../transforms/mul-fraction';
import { simplifyMul } from '../transforms/simplify-mul';
import { mulByZeroIsZero } from '../transforms/mul-by-zero-is-zero';
import { simplifyDivByFrac } from '../transforms/simplify-div-by-frac';
import { removePowOne } from '../transforms/remove-pow-one';
import { mulToPow } from '../transforms/mul-to-pow';
import { multiplyPowers } from '../transforms/multiply-powers';
import { dividePowers } from '../transforms/divide-powers';

import { distributeRule, dropAddIdentityRule, simplifyRules } from '../rules';

type Node = Semantic.types.Node;

// Every transform `simplify()` uses, with the id of its rule and an input it
// rewrites. The tests below check that each rule wraps the transform next to
// it, and that this table, `simplifyRules` and `simplifyTransforms` in
// `simplify.ts` are all in the same order.
const transforms: readonly (readonly [string, Transform, string])[] = [
  ['drop-add-identity', dropAddIdentity, 'x + 0'],
  ['simplify-div-by-frac', simplifyDivByFrac, '\\frac{a}{\\frac{b}{c}}'],
  ['simplify-mul', simplifyMul, '1x'],
  ['mul-by-zero-is-zero', mulByZeroIsZero, '0x'],
  ['distribute', distribute, '3(x + 1)'],
  ['distribute-div', distributeDiv, '\\frac{a+b}{c}'],
  ['collect-like-terms', collectLikeTerms, '3x + 4x'],
  ['drop-parens', dropParens, '(x + 1) + 4'],
  ['eval-mul', evalMul, '(3)(3)'],
  ['eval-add', evalAdd, '1 + 4'],
  ['reduce-fraction', reduceFraction, '\\frac{4}{6}'],
  ['mul-fraction', mulFraction, '\\frac{1}{2} * \\frac{x}{3}'],
  ['eval-div', evalDiv, '\\frac{6}{2}'],
  ['mul-to-pow', mulToPow, '(x)(x)'],
  ['multiply-powers', multiplyPowers, 'x^2x^3'],
  ['divide-powers', dividePowers, '\\frac{x^5}{x^3}'],
  ['remove-pow-one', removePowOne, 'x^1'],
  ['add-neg-to-sub', addNegToSub, 'x + -1'],
];

const ruleFor = (id: string): Rule => {
  const rule = simplifyRules.find((rule) => rule.id === id);
  if (!rule) {
    throw new Error(`no rule with id '${id}'`);
  }
  return rule;
};

const stepsOf = (rule: Rule, node: Node, context: Context): Step[] => [
  ...rule.apply(node, context),
];

describe('simplifyRules', () => {
  test('has a rule for every transform, in the order simplify() tries them', () => {
    expect(simplifyRules.map((rule) => rule.id)).toEqual(
      transforms.map(([id]) => id),
    );
  });

  test('is in the same order as simplifyTransforms in simplify.ts', () => {
    // The id of each transform simplify() uses, in the order it tries them.
    const ids = simplifyTransforms.map((transform) => {
      const entry = transforms.find(([, t]) => t === transform);
      if (!entry) {
        throw new Error('simplifyTransforms has a transform with no rule');
      }
      return entry[0];
    });

    expect(simplifyRules.map((rule) => rule.id)).toEqual(ids);
  });

  test('has unique ids', () => {
    const ids = simplifyRules.map((rule) => rule.id);
    expect(new Set(ids).size).toEqual(ids.length);
  });
});

describe('each rule', () => {
  test.each(transforms)(
    '%s yields exactly the step its transform returns',
    (id, transform, input) => {
      const node = parse(input);
      const context = rootContext();

      const expected = transform(node, context.path, simplify);

      const steps = stepsOf(ruleFor(id), node, context);

      // Make sure the input exercises the transform.
      if (!expected) {
        throw new Error(`${id} doesn't rewrite ${input}`);
      }
      expect(steps).toHaveLength(1);
      expect(steps[0].message).toEqual(expected.message);
      expect(steps[0].before).toBe(node);
      expect(print(steps[0].after)).toEqual(print(expected.after));
      // Each call builds new nodes with new ids, so compare ignoring ids.
      expect(Semantic.util.deepEquals(steps[0], expected)).toBe(true);
    },
  );

  test.each(transforms)(
    '%s yields nothing when its transform returns undefined',
    (id, transform) => {
      const node = parse('x');
      const context = rootContext();

      expect(transform(node, context.path, simplify)).toBeUndefined();
      expect(stepsOf(ruleFor(id), node, context)).toEqual([]);
    },
  );
});

describe('dropAddIdentityRule', () => {
  test('rewrites x + 0 to x', () => {
    const result = run(fromRule(dropAddIdentityRule), parse('x + 0'));

    expect(result?.steps.map((step) => step.message)).toEqual([
      'drop adding zero',
    ]);
    expect(result && print(result.node)).toEqual('x');
  });

  test('fails on x + 1', () => {
    expect(run(fromRule(dropAddIdentityRule), parse('x + 1'))).toBeUndefined();
  });
});

describe('distributeRule', () => {
  // `distribute` leaves a product inside a sum to its parent, so that
  // 1 + 2(x + 1) becomes 1 + 2x + 2 rather than 1 + (2x + 2).
  const parent = parse('1 + 2(x + 1)');
  if (parent.type !== Semantic.NodeType.Add) {
    throw new Error('expected a sum');
  }
  const node = parent.args[1];

  test('distributes a product with no parent', () => {
    const [step] = stepsOf(distributeRule, node, rootContext());

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toEqual('2x+2');
  });

  test('declines a product whose parent is a sum', () => {
    expect(stepsOf(distributeRule, node, { path: [parent] })).toEqual([]);
  });

  test('distributes the sum that contains the product', () => {
    const [step] = stepsOf(distributeRule, parent, rootContext());

    expect(print(step.after)).toEqual('1+2x+2');
  });
});
