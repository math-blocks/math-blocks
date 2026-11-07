import type * as Semantic from '@math-blocks/semantic';

import type { Step } from '../types';

import type {
  Context,
  Derivation,
  Rule,
  StepBranch,
  Strategy,
  Trace,
} from './types';

type Node = Semantic.types.Node;

/**
 * A context for applying a strategy to the root of an expression.
 *
 * Returns a new object on every call, so no caller can change a context that
 * another caller is using.
 */
export const rootContext = (): Context => ({ path: [] });

/** A trace that finishes at `node` without taking any steps. */
export const done = (node: Node): Trace => [{ type: 'done', node }];

/** A trace with no alternatives: the strategy failed. */
export const fail = (): Trace => [];

/**
 * A strategy that applies `rule` at the node it's given and then finishes.
 * It has one alternative for each step the rule yields, in the same order.
 */
export const fromRule = (rule: Rule): Strategy =>
  function* (node, context): Generator<StepBranch> {
    for (const step of rule.apply(node, context)) {
      yield {
        type: 'step',
        step,
        path: context.path,
        node: step.after,
        next: () => done(step.after),
      };
    }
  };

// `steps` holds the steps taken so far on the current path. It's shared
// across the recursion so that building the result is linear in its length.
const firstDerivation = (
  trace: Trace,
  steps: Step[], // eslint-disable-line functional/prefer-readonly-type
): Derivation | undefined => {
  for (const branch of trace) {
    if (branch.type === 'done') {
      return { steps, node: branch.node };
    }
    steps.push(branch.step);
    const result = firstDerivation(branch.next(), steps);
    if (result) {
      return result;
    }
    // This step leads to a dead end, so try the next alternative.
    steps.pop();
  }
  return undefined;
};

/**
 * Returns the preferred derivation in `trace`: the first alternative at every
 * point, backtracking past dead ends. Returns `undefined` if no alternative
 * finishes.
 *
 * Use this when you already have a trace, for example to check whether a
 * step's continuation (`branch.next()`) can finish. Only the branches needed
 * to find the derivation are computed.
 */
export const firstDerivationOf = (trace: Trace): Derivation | undefined =>
  firstDerivation(trace, []);

/**
 * Applies `strategy` to `node` and returns its preferred derivation (see
 * `firstDerivationOf`). Returns `undefined` if the strategy fails.
 */
export const run = (
  strategy: Strategy,
  node: Node,
  context: Context = rootContext(),
): Derivation | undefined => firstDerivationOf(strategy(node, context));
