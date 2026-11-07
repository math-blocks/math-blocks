import type * as Semantic from '@math-blocks/semantic';

import type { Step } from '../types';

import { derivationsOf, done, fail } from './trace';
import type { Branch, Context, Strategy, Trace } from './types';

type Node = Semantic.types.Node;

// Fields every step has. Some messages in the `Step` union also require
// extra fields, such as `numberOfSolutions`.
type BaseStepField = 'message' | 'before' | 'after' | 'substeps' | 'section';

/**
 * The step messages that need no fields beyond `before`, `after` and
 * `substeps`. `named` only accepts these, because it can't supply the extra
 * fields that other messages (such as 'solve for variable') require.
 */
export type PlainStepMessage = {
  readonly [M in Step['message']]: Exclude<
    keyof Extract<Step, { readonly message: M }>,
    BaseStepField
  > extends never
    ? M
    : never;
}[Step['message']];

const plainStep = (
  message: PlainStepMessage,
  before: Node,
  after: Node,
  substeps: readonly Step[],
): Step =>
  // TypeScript can't check this assignment because the `Step` union has too
  // many members to match `message` against. It's safe: every
  // `PlainStepMessage` belongs to a variant with exactly these fields.
  ({ message, before, after, substeps } as Step);

/** Finishes at the node it's given without taking a step. Always succeeds. */
export const identity: Strategy = (node) => done(node);

// Continues every derivation in `trace` with `next`, starting from the node
// that derivation finished at.
function* bind(trace: Trace, next: (node: Node) => Trace): Generator<Branch> {
  for (const branch of trace) {
    if (branch.type === 'done') {
      yield* next(branch.node);
    } else {
      yield { ...branch, next: () => bind(branch.next(), next) };
    }
  }
}

/**
 * Applies each strategy in turn, each to the result of the one before. Fails
 * if any of them fails. `seq()` with no strategies is `identity`.
 *
 * The steps of an earlier strategy are reported before the later strategies
 * run, so a later failure shows up as a dead end after those steps rather
 * than as no alternatives (see "Dead ends" in the README). `run` backtracks
 * past it.
 */
export const seq =
  (...strategies: readonly Strategy[]): Strategy =>
  (node, context) =>
    strategies.reduceRight<(node: Node) => Trace>(
      (rest, strategy) => (n) => bind(strategy(n, context), rest),
      done,
    )(node);

/**
 * Left-biased choice: uses the first strategy that has any alternatives at
 * this node, and only that one. `choice()` with no strategies always fails.
 *
 * A strategy counts as applicable if it can take a first step or finish
 * without a step. `choice` doesn't look further ahead, so it doesn't fall
 * back to a later strategy when the chosen one hits a dead end later on.
 * This matches the Ideas framework's left-biased choice. It differs from
 * Stratego's `<+` only for strategies such as `seq(a, b)` where `a` applies
 * but `b` then fails.
 */
export const choice = (...strategies: readonly Strategy[]): Strategy =>
  function* (node, context): Generator<Branch> {
    for (const strategy of strategies) {
      let applied = false;
      for (const branch of strategy(node, context)) {
        applied = true;
        yield branch;
      }
      if (applied) {
        return;
      }
    }
  };

/** Applies `strategy` if it's applicable, otherwise finishes unchanged. */
export const tryS = (strategy: Strategy): Strategy =>
  choice(strategy, identity);

/**
 * Applies `strategy` again and again, each time to the result of the last,
 * until it no longer applies or it has been applied `max` times. Always
 * succeeds: if `strategy` doesn't apply at all, this finishes unchanged.
 *
 * Stopping at `max` is silent, the same way the loops in `simplify()` stop
 * at 10 today.
 */
export const repeat = (
  strategy: Strategy,
  options: { readonly max: number },
): Strategy => {
  const { max } = options;
  if (!Number.isInteger(max) || max < 0) {
    throw new RangeError(
      `repeat: max must be a non-negative integer, got ${max}`,
    );
  }
  const repeatAtMost =
    (n: number): Strategy =>
    (node, context) =>
      n === 0
        ? done(node)
        : tryS(seq(strategy, repeatAtMost(n - 1)))(node, context);
  return repeatAtMost(max);
};

/**
 * Groups the steps of each derivation of `strategy` into one step with
 * `message`. The grouped steps become that step's `substeps`, and its
 * `before` and `after` are the node before and after the whole derivation.
 *
 * There is one alternative for each complete derivation of `strategy`, in
 * the same order. A derivation with no steps finishes without a step, so
 * `named` never produces a step with no substeps. If `strategy` fails, so
 * does `named`.
 *
 * Each derivation of `strategy` is computed in full before its step is
 * reported, since the step's `after` depends on it.
 */
export const named = (
  message: PlainStepMessage,
  strategy: Strategy,
): Strategy =>
  function* (node, context): Generator<Branch> {
    for (const derivation of derivationsOf(strategy(node, context))) {
      if (derivation.steps.length === 0) {
        yield { type: 'done', node: derivation.node };
      } else {
        const after = derivation.node;
        yield {
          type: 'step',
          step: plainStep(message, node, after, derivation.steps),
          path: context.path,
          node: after,
          next: () => done(after),
        };
      }
    }
  };

/**
 * Applies `strategy` only when `predicate` holds for the node (and its
 * context). Otherwise it fails.
 */
export const guard =
  (
    predicate: (node: Node, context: Context) => boolean,
    strategy: Strategy,
  ): Strategy =>
  (node, context) =>
    predicate(node, context) ? strategy(node, context) : fail();
