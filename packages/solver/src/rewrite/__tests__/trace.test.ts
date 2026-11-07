import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';
import { parse, print } from '../../test-util';
import { dropAddIdentity } from '../../simplify/transforms/drop-add-identity';

import { done, fail, fromRule, rootContext, run } from '../trace';
import type { Branch, Context, Rule, Strategy, Trace } from '../types';

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

describe('done and fail', () => {
  test('done has one alternative that finishes at the node', () => {
    const node = parse('x');
    expect(toArray(done(node))).toEqual([{ type: 'done', node }]);
  });

  test('fail has no alternatives', () => {
    expect(toArray(fail())).toEqual([]);
  });
});

describe('fromRule', () => {
  test('has one step alternative per step the rule yields, in order', () => {
    const node = parse('x');

    const branches = toArray(fromRule(oneOrTwo)(node, rootContext));

    expect(branches.map((b) => b.type)).toEqual(['step', 'step']);
    expect(
      branches.map((b) => (b.type === 'step' ? print(b.node) : null)),
    ).toEqual(['1', '2']);
  });

  test('each step finishes at the rewritten node', () => {
    const node = parse('x + 0');

    const [branch] = toArray(fromRule(dropAddIdentityRule)(node, rootContext));

    if (branch.type !== 'step') {
      throw new Error('expected a step');
    }
    expect(branch.step.message).toEqual('drop adding zero');
    expect(toArray(branch.next())).toEqual([
      { type: 'done', node: branch.node },
    ]);
    expect(print(branch.node)).toEqual('x');
  });

  test('has no alternatives when the rule fails', () => {
    const node = parse('x + 1');
    expect(toArray(fromRule(dropAddIdentityRule)(node, rootContext))).toEqual(
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
    expect(branch.type === 'step' && branch.path).toEqual([parent]);
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
    expect(branch.type === 'step' && print(branch.node)).toEqual('x');
    expect(branch.type === 'step' && branch.path).toEqual([parent]);
    expect(run(fromRule(dropAddIdentityRule), node, context)?.node).toEqual(
      branch.type === 'step' && branch.node,
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

    const trace = fromRule(rule)(parse('x'), rootContext);
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

describe('enumeration', () => {
  test('the step branches of a trace are the candidate next steps', () => {
    const trace = fromRule(oneOrTwo)(parse('x'), rootContext);

    const nextSteps = toArray(trace).flatMap((b) =>
      b.type === 'step' ? [print(b.step.after)] : [],
    );

    expect(nextSteps).toEqual(['1', '2']);
  });
});
