import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';
import { parse, print } from '../../test-util';
import { dropAddIdentity } from '../../simplify/transforms/drop-add-identity';

import { done, fail, fromRule, rootContext, run } from '../trace';
import type {
  Branch,
  Context,
  Rule,
  StepBranch,
  Strategy,
  Trace,
} from '../types';

type Node = Semantic.types.Node;

const step = (before: Node, after: Node): Step => ({
  message: 'test',
  before,
  after,
  substeps: [],
});

// Wraps an existing transform as a rule.
const dropAddIdentityRule: Rule = {
  id: 'drop-add-identity',
  *apply(node) {
    const result = dropAddIdentity(node);
    if (result) {
      yield result;
    }
  },
};

// A rule that can rewrite any node to 1 or to 2, preferring 1.
const oneOrTwo: Rule = {
  id: 'one-or-two',
  *apply(node) {
    yield step(node, Semantic.builders.number('1'));
    yield step(node, Semantic.builders.number('2'));
  },
};

const failing: Rule = {
  id: 'failing',
  *apply() {
    // never applies
  },
};

const toArray = (trace: Trace): Branch[] => [...trace];

// Fails the test unless `branch` is a step. Unlike a bare `expect`, it also
// narrows the type so the test can use the step's fields.
function expectStep(branch: Branch): asserts branch is StepBranch {
  expect(branch.type).toEqual('step');
}

describe('done and fail', () => {
  test('done has one alternative that finishes at the node', () => {
    const node = parse('x');
    expect(toArray(done(node))).toEqual([{ type: 'done', node }]);
  });

  test('fail has no alternatives', () => {
    expect(toArray(fail())).toEqual([]);
  });
});

describe('rootContext', () => {
  test('has an empty path', () => {
    expect(rootContext()).toEqual({ path: [] });
  });

  test('returns a new context on every call', () => {
    const a = rootContext();
    const b = rootContext();

    (a.path as Node[]).push(parse('x'));

    expect(a).not.toBe(b);
    expect(b.path).toEqual([]);
    expect(rootContext().path).toEqual([]);
  });
});

describe('fromRule', () => {
  test('has one step alternative per step the rule yields, in order', () => {
    const node = parse('x');

    const branches = toArray(fromRule(oneOrTwo)(node, rootContext()));

    expect(branches.map((b) => b.type)).toEqual(['step', 'step']);
    expect(
      branches.map((b) => (b.type === 'step' ? print(b.node) : null)),
    ).toEqual(['1', '2']);
  });

  test('each step finishes at the rewritten node', () => {
    const node = parse('x + 0');

    const [branch] = toArray(
      fromRule(dropAddIdentityRule)(node, rootContext()),
    );

    expectStep(branch);
    expect(branch.step.message).toEqual('drop adding zero');
    expect(toArray(branch.next())).toEqual([
      { type: 'done', node: branch.node },
    ]);
    expect(print(branch.node)).toEqual('x');
  });

  test('has no alternatives when the rule fails', () => {
    const node = parse('x + 1');
    expect(toArray(fromRule(dropAddIdentityRule)(node, rootContext()))).toEqual(
      [],
    );
  });

  test('passes the context to the rule and records the path', () => {
    const parent = parse('2(x + 0)');
    const node = parse('x + 0');
    const context: Context = { path: [parent] };
    const seen: Context[] = [];
    const rule: Rule = {
      id: 'spy',
      *apply(node, context) {
        seen.push(context);
        yield step(node, node);
      },
    };

    const [branch] = toArray(fromRule(rule)(node, context));

    expect(seen).toEqual([context]);
    expectStep(branch);
    expect(branch.path).toEqual([parent]);
  });

  test('applied at a subterm, the result is the rewritten subterm', () => {
    const parent = parse('2(x + 0)');
    if (parent.type !== Semantic.NodeType.Mul) {
      throw new Error('expected a product');
    }
    const node = parent.args[1];
    const context: Context = { path: [parent] };

    const [branch] = toArray(fromRule(dropAddIdentityRule)(node, context));

    // Rebuilding the enclosing expression is the job of the traversal
    // combinator that applied the strategy at this subterm.
    expectStep(branch);
    expect(print(branch.node)).toEqual('x');
    expect(branch.path).toEqual([parent]);
    expect(run(fromRule(dropAddIdentityRule), node, context)?.node).toEqual(
      branch.node,
    );
  });

  test('only asks the rule for the alternatives that are read', () => {
    let produced = 0;
    const rule: Rule = {
      id: 'counting',
      *apply(node) {
        for (;;) {
          produced++;
          yield step(node, node);
        }
      },
    };

    const trace = fromRule(rule)(parse('x'), rootContext());
    const iterator = trace[Symbol.iterator]();
    iterator.next();

    expect(produced).toEqual(1);
  });
});

describe('run', () => {
  test('returns the preferred derivation', () => {
    const result = run(fromRule(oneOrTwo), parse('x'));

    expect(result?.steps.map((s) => print(s.after))).toEqual(['1']);
    expect(result && print(result.node)).toEqual('1');
  });

  test('returns no steps when the strategy finishes immediately', () => {
    const node = parse('x');
    expect(run(done, node)).toEqual({ steps: [], node });
  });

  test('returns undefined when the strategy fails', () => {
    expect(run(fromRule(failing), parse('x'))).toBeUndefined();
  });

  test('backtracks past a step that leads to a dead end', () => {
    // Rewrites to 1 or 2, then requires the result to be 2.
    const strategy: Strategy = function* (node, context) {
      for (const branch of fromRule(oneOrTwo)(node, context)) {
        if (branch.type === 'step') {
          const after = branch.node;
          yield {
            ...branch,
            next: () =>
              Semantic.util.deepEquals(after, Semantic.builders.number('2'))
                ? done(after)
                : fail(),
          };
        }
      }
    };

    const result = run(strategy, parse('x'));

    expect(result?.steps.map((s) => print(s.after))).toEqual(['2']);
  });

  test('only computes the branches on the preferred path', () => {
    const called: string[] = [];
    const strategy: Strategy = function* (node) {
      const a = Semantic.builders.number('1');
      const b = Semantic.builders.number('2');
      yield {
        type: 'step',
        step: step(node, a),
        path: [],
        node: a,
        next: () => {
          called.push('a');
          return done(a);
        },
      };
      called.push('second alternative');
      yield {
        type: 'step',
        step: step(node, b),
        path: [],
        node: b,
        next: () => {
          called.push('b');
          return done(b);
        },
      };
    };

    run(strategy, parse('x'));

    expect(called).toEqual(['a']);
  });
});

// A tree of alternatives to build a strategy from. Each step rewrites to the
// number in its label, so the steps a derivation took can be read back with
// `print`. A step with no `next` alternatives is a dead end.
type TreeNode =
  | { readonly done: string }
  | { readonly step: string; readonly next: readonly TreeNode[] };

const traceOf = (alternatives: readonly TreeNode[]): Trace =>
  alternatives.map((alt): Branch => {
    if ('done' in alt) {
      return { type: 'done', node: Semantic.builders.number(alt.done) };
    }
    const after = Semantic.builders.number(alt.step);
    return {
      type: 'step',
      step: step(Semantic.builders.number('0'), after),
      path: [],
      node: after,
      next: () => traceOf(alt.next),
    };
  });

const strategyOf =
  (alternatives: readonly TreeNode[]): Strategy =>
  () =>
    traceOf(alternatives);

const stepsOf = (alternatives: readonly TreeNode[]): string[] | undefined =>
  run(strategyOf(alternatives), parse('x'))?.steps.map((s) => print(s.after));

describe('run: choosing a derivation', () => {
  test('returns every step of a multi-step derivation, in order', () => {
    const tree = [
      {
        step: '1',
        next: [{ step: '2', next: [{ step: '3', next: [{ done: '3' }] }] }],
      },
    ];

    expect(stepsOf(tree)).toEqual(['1', '2', '3']);
  });

  test('returns the node from the done branch', () => {
    const result = run(
      strategyOf([{ step: '1', next: [{ done: '7' }] }]),
      parse('x'),
    );

    expect(result && print(result.node)).toEqual('7');
  });

  test('prefers an earlier done branch over a later step', () => {
    expect(
      stepsOf([{ done: '0' }, { step: '1', next: [{ done: '1' }] }]),
    ).toEqual([]);
  });

  test('leaves out the steps of a dead end found deeper in the tree', () => {
    // 1 → 2 is a dead end, so the derivation is 1 → 3. The step to 2 must not
    // be left in the result.
    const tree = [
      {
        step: '1',
        next: [
          { step: '2', next: [] },
          { step: '3', next: [{ done: '3' }] },
        ],
      },
    ];

    expect(stepsOf(tree)).toEqual(['1', '3']);
  });

  test('backtracks more than one level', () => {
    // Everything after 1 is a dead end, so the derivation starts with 4.
    const tree = [
      {
        step: '1',
        next: [
          { step: '2', next: [{ step: '3', next: [] }] },
          { step: '5', next: [] },
        ],
      },
      { step: '4', next: [{ done: '4' }] },
    ];

    expect(stepsOf(tree)).toEqual(['4']);
  });

  test('finishes without a step when the only steps are dead ends', () => {
    expect(stepsOf([{ step: '1', next: [] }, { done: '0' }])).toEqual([]);
  });

  test('returns undefined when every alternative is a dead end', () => {
    const tree = [
      { step: '1', next: [{ step: '2', next: [] }] },
      { step: '3', next: [] },
    ];

    expect(stepsOf(tree)).toBeUndefined();
  });

  test('returns a separate steps array from each call', () => {
    const strategy = strategyOf([{ step: '1', next: [{ done: '1' }] }]);

    const first = run(strategy, parse('x'));
    const second = run(strategy, parse('x'));

    expect(first?.steps).not.toBe(second?.steps);
    expect(second?.steps.map((s) => print(s.after))).toEqual(['1']);
  });
});

describe('enumeration', () => {
  test('the step branches of a trace are the candidate next steps', () => {
    const trace = fromRule(oneOrTwo)(parse('x'), rootContext());

    const nextSteps = toArray(trace).flatMap((b) =>
      b.type === 'step' ? [print(b.step.after)] : [],
    );

    expect(nextSteps).toEqual(['1', '2']);
  });
});
