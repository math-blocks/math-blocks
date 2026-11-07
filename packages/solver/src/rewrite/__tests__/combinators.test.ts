import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

import {
  choice,
  guard,
  identity,
  named,
  repeat,
  seq,
  tryS,
} from '../combinators';
import { fromRule, rootContext, run } from '../trace';
import type { Branch, Context, Rule, StepBranch, Strategy } from '../types';

type Node = Semantic.types.Node;

const num = (n: number): Node => Semantic.builders.number(String(n));

const valueOf = (node: Node): number => {
  if (node.type !== Semantic.NodeType.Number) {
    throw new Error('expected a number');
  }
  return Number(node.value);
};

// A strategy from a rule that rewrites a number to each of the numbers
// `rewrite` returns, in order. Returning [] means the rule doesn't apply.
const numberRule = (
  id: string,
  rewrite: (n: number) => readonly number[],
): Strategy => {
  const rule: Rule = {
    id,
    *apply(node) {
      for (const n of rewrite(valueOf(node))) {
        const step: Step = {
          message: 'test',
          before: node,
          after: num(n),
          substeps: [],
        };
        yield step;
      }
    },
  };
  return fromRule(rule);
};

const inc = numberRule('inc', (n) => [n + 1]);
const double = numberRule('double', (n) => [n * 2]);
const incBelow = (limit: number): Strategy =>
  numberRule('inc-below', (n) => (n < limit ? [n + 1] : []));
// Two alternatives: add 1 (preferred) or add 10.
const fork = numberRule('fork', (n) => [n + 1, n + 10]);
const never = numberRule('never', () => []);
const above = (limit: number) => (node: Node) => valueOf(node) > limit;

// The value after each step of the preferred derivation, or undefined if
// the strategy fails.
const stepsOf = (strategy: Strategy, start: number): number[] | undefined =>
  run(strategy, num(start))?.steps.map((s) => valueOf(s.after));

const branchesOf = (strategy: Strategy, start: number): Branch[] => [
  ...strategy(num(start), rootContext()),
];

// The value after each first step the strategy offers.
const firstStepsOf = (strategy: Strategy, start: number): number[] =>
  branchesOf(strategy, start).flatMap((b) =>
    b.type === 'step' ? [valueOf(b.node)] : [],
  );

function expectStep(branch: Branch): asserts branch is StepBranch {
  expect(branch.type).toEqual('step');
}

// Records each call, then delegates to `strategy`.
const spy =
  (
    calls: string[], // eslint-disable-line functional/prefer-readonly-type
    name: string,
    strategy: Strategy,
  ): Strategy =>
  (node, context) => {
    calls.push(name);
    return strategy(node, context);
  };

describe('identity', () => {
  test('finishes unchanged without a step', () => {
    const start = num(1);
    expect(run(identity, start)).toEqual({ steps: [], node: start });
  });
});

describe('seq', () => {
  test('applies each strategy to the result of the one before', () => {
    expect(stepsOf(seq(inc, double), 1)).toEqual([2, 4]);
    expect(stepsOf(seq(double, inc), 1)).toEqual([2, 3]);
  });

  test('with no strategies, finishes unchanged', () => {
    expect(stepsOf(seq(), 1)).toEqual([]);
  });

  test('fails when the first strategy fails', () => {
    expect(branchesOf(seq(never, inc), 1)).toEqual([]);
    expect(stepsOf(seq(never, inc), 1)).toBeUndefined();
  });

  test('a later failure is a dead end after the earlier steps', () => {
    const [branch, ...rest] = branchesOf(seq(inc, never), 1);

    expectStep(branch);
    expect(rest).toEqual([]);
    expect([...branch.next()]).toEqual([]);
    expect(stepsOf(seq(inc, never), 1)).toBeUndefined();
  });

  test("run backtracks into an earlier strategy's alternatives", () => {
    // fork offers 2 then 11. Only 11 passes the guard.
    const strategy = seq(fork, guard(above(5), inc));

    expect(stepsOf(strategy, 1)).toEqual([11, 12]);
  });

  test('offers each alternative of the first strategy as a next step', () => {
    expect(firstStepsOf(seq(fork, inc), 1)).toEqual([2, 11]);
  });

  test("doesn't run a later strategy until it's needed", () => {
    const calls: string[] = [];
    const strategy = seq(inc, spy(calls, 'double', double));

    const [branch] = branchesOf(strategy, 1);
    expect(calls).toEqual([]);

    expectStep(branch);
    [...branch.next()];
    expect(calls).toEqual(['double']);
  });

  test('passes the same context to every strategy', () => {
    const seen: Context[] = [];
    const record: Strategy = (node, context) => {
      seen.push(context);
      return inc(node, context);
    };
    const context: Context = { path: [num(0)] };

    run(seq(record, record), num(1), context);

    expect(seen).toEqual([context, context]);
  });
});

describe('choice', () => {
  test('uses the first strategy that applies', () => {
    expect(stepsOf(choice(never, inc, double), 3)).toEqual([4]);
  });

  test('only offers the alternatives of the chosen strategy', () => {
    expect(firstStepsOf(choice(fork, double), 1)).toEqual([2, 11]);
  });

  test('a strategy that finishes without a step counts as applying', () => {
    expect(stepsOf(choice(identity, inc), 1)).toEqual([]);
  });

  test('fails when no strategy applies, or there are none', () => {
    expect(stepsOf(choice(never, never), 1)).toBeUndefined();
    expect(stepsOf(choice(), 1)).toBeUndefined();
  });

  test("doesn't try later strategies once one applies", () => {
    const calls: string[] = [];

    run(choice(inc, spy(calls, 'double', double)), num(1));

    expect(calls).toEqual([]);
  });

  test("doesn't fall back when the chosen strategy hits a dead end later", () => {
    // seq(inc, never) applies, because inc takes a first step. The dead end
    // after it doesn't make choice try double.
    expect(stepsOf(choice(seq(inc, never), double), 1)).toBeUndefined();
  });
});

describe('tryS', () => {
  test('applies the strategy when it applies', () => {
    expect(stepsOf(tryS(inc), 1)).toEqual([2]);
  });

  test("finishes unchanged when the strategy doesn't apply", () => {
    const start = num(1);
    expect(run(tryS(never), start)).toEqual({ steps: [], node: start });
  });
});

describe('repeat', () => {
  test('applies the strategy until it no longer applies', () => {
    expect(stepsOf(repeat(incBelow(3), { max: 10 }), 0)).toEqual([1, 2, 3]);
  });

  test('stops after max applications', () => {
    expect(stepsOf(repeat(inc, { max: 3 }), 0)).toEqual([1, 2, 3]);
  });

  test('stops exactly at max when the strategy would stop then anyway', () => {
    expect(stepsOf(repeat(incBelow(3), { max: 3 }), 0)).toEqual([1, 2, 3]);
  });

  test('with max 0, or a strategy that never applies, finishes unchanged', () => {
    expect(stepsOf(repeat(inc, { max: 0 }), 0)).toEqual([]);
    expect(stepsOf(repeat(never, { max: 10 }), 0)).toEqual([]);
  });

  test('offers the alternatives of each application', () => {
    expect(firstStepsOf(repeat(fork, { max: 2 }), 0)).toEqual([1, 10]);
    expect(stepsOf(repeat(fork, { max: 2 }), 0)).toEqual([1, 2]);
  });

  test('rejects a max that is negative or not an integer', () => {
    expect(() => repeat(inc, { max: -1 })).toThrow(RangeError);
    expect(() => repeat(inc, { max: 1.5 })).toThrow(RangeError);
  });
});

describe('named', () => {
  test("groups a derivation's steps into one step", () => {
    const result = run(named('distribute', seq(inc, double)), num(1));

    expect(result?.steps).toHaveLength(1);
    const [step] = result?.steps ?? [];
    expect(step.message).toEqual('distribute');
    expect(valueOf(step.before)).toEqual(1);
    expect(valueOf(step.after)).toEqual(4);
    expect(step.substeps.map((s) => valueOf(s.after))).toEqual([2, 4]);
    expect(result && valueOf(result.node)).toEqual(4);
  });

  test('nests inside another named step', () => {
    const strategy = named(
      'simplify expression',
      seq(named('distribute', seq(inc, inc)), double),
    );

    const [outer] = run(strategy, num(1))?.steps ?? [];

    expect(outer.message).toEqual('simplify expression');
    expect(outer.substeps.map((s) => s.message)).toEqual([
      'distribute',
      'test',
    ]);
    expect(outer.substeps[0].substeps.map((s) => valueOf(s.after))).toEqual([
      2, 3,
    ]);
    expect(valueOf(outer.after)).toEqual(6);
  });

  test('finishes without a step when the derivation has no steps', () => {
    const start = num(1);
    expect(run(named('distribute', identity), start)).toEqual({
      steps: [],
      node: start,
    });
  });

  test('fails when the strategy fails', () => {
    expect(stepsOf(named('distribute', never), 1)).toBeUndefined();
  });

  test('has one alternative per complete derivation, skipping dead ends', () => {
    expect(firstStepsOf(named('distribute', fork), 1)).toEqual([2, 11]);
    // Only the derivation through 11 passes the guard.
    expect(
      firstStepsOf(named('distribute', seq(fork, guard(above(5), inc))), 1),
    ).toEqual([12]);
  });

  test("records the context's path", () => {
    const parent = num(0);
    const context: Context = { path: [parent] };

    const [branch] = [...named('distribute', inc)(num(1), context)];

    expectStep(branch);
    expect(branch.path).toEqual([parent]);
  });

  test('only accepts messages that need no extra fields', () => {
    // @ts-expect-error: 'solve for variable' steps need numberOfSolutions
    named('solve for variable', inc);
  });
});

describe('guard', () => {
  test('applies the strategy when the predicate holds', () => {
    expect(stepsOf(guard(above(0), inc), 1)).toEqual([2]);
  });

  test("fails when the predicate doesn't hold", () => {
    expect(stepsOf(guard(above(5), inc), 1)).toBeUndefined();
  });

  test('passes the node and context to the predicate', () => {
    const start = num(1);
    const context: Context = { path: [num(0)] };
    const seen: [Node, Context][] = [];

    run(
      guard((node, context) => {
        seen.push([node, context]);
        return true;
      }, inc),
      start,
      context,
    );

    expect(seen).toEqual([[start, context]]);
  });
});
