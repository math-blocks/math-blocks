import type * as Semantic from '@math-blocks/semantic';

import type { Step } from '../types';

type Node = Semantic.types.Node;

/**
 * Where in the expression a rule or strategy is being applied.
 */
export type Context = {
  /**
   * The ancestors of the node being rewritten, root first, not including
   * the node itself. `path[path.length - 1]` is the parent.
   *
   * This matches the `path` argument that `simplify()` passes to transforms
   * today, which `distribute` and `simplifyMul` use to look at the parent.
   */
  readonly path: readonly Node[];
};

/**
 * A named local rewrite.
 *
 * A rule looks only at the node it is given (and, through `context.path`, at
 * that node's ancestors). It either fails or produces one or more `Step`s.
 * Each step's `before` is the node and its `after` is the replacement.
 *
 * Rules don't decide where or when they're applied; strategies do.
 */
export type Rule = {
  /** Stable identifier, e.g. 'drop-add-identity'. */
  readonly id: string;

  /**
   * Every way this rule can rewrite `node`, most preferred first. Yielding
   * nothing means the rule fails at this node.
   *
   * Most rules yield at most one step. Pattern rules can yield one per
   * match. The result is iterated lazily, so a rule should be written as a
   * generator (or otherwise compute later alternatives only on demand).
   */
  readonly apply: (node: Node, context: Context) => Iterable<Step>;
};

/**
 * The strategy has finished. `node` is what the node the strategy was applied
 * to became (see `StepBranch.node`).
 */
export type DoneBranch = {
  readonly type: 'done';
  readonly node: Node;
};

/**
 * The strategy takes `step` next.
 */
export type StepBranch = {
  readonly type: 'step';

  /** The step taken. Its `before` and `after` are the rewritten subterm. */
  readonly step: Step;

  /**
   * The ancestors of `step.before`, root first. This includes the
   * `context.path` the strategy was started with.
   */
  readonly path: readonly Node[];

  /**
   * The node the strategy was applied to, as it is after this step.
   *
   * This is not the top-level expression when the strategy was applied to a
   * subterm (`context.path` is non-empty). A strategy only sees the node it
   * is given, so the traversal combinator that applied it at a subterm is
   * responsible for rebuilding the enclosing expression around this node.
   */
  readonly node: Node;

  /**
   * What the strategy can do after this step. Called on demand, so nothing
   * past this step is computed until someone asks for it.
   *
   * The returned trace can be empty: this step was allowed, but the
   * strategy can't finish after it (a dead end). See `run`.
   */
  readonly next: () => Trace;
};

export type Branch = DoneBranch | StepBranch;

/**
 * The alternatives a strategy has from one point, most preferred first.
 *
 * Together with each `StepBranch.next`, a trace describes a lazy tree of
 * every derivation the strategy allows. An empty trace means the strategy
 * failed (or, after a step, hit a dead end).
 *
 * A trace may only be iterable once (generators are), so consumers that
 * need to look at the alternatives more than once must buffer them.
 */
export type Trace = Iterable<Branch>;

/**
 * Controls where and when rules are applied, and records the steps it takes.
 *
 * Applying a strategy to a node returns a `Trace` rather than a single
 * result, so callers can either follow the preferred derivation (`run`) or
 * enumerate the candidate next steps (the first `StepBranch`es of the trace).
 */
export type Strategy = (node: Node, context: Context) => Trace;

/**
 * One complete derivation: the steps taken, in order, and what the node the
 * strategy was applied to became.
 */
export type Derivation = {
  readonly steps: readonly Step[];
  readonly node: Node;
};
