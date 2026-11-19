import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

const { NodeType } = Semantic;

/**
 * How `checkStep` compares the two steps' solved answers.
 *
 * - `'form'` (the default): an answer that gives the variable a number, such
 *   as `x = 5/2` or `2.5 < x`, matches another that uses the same variable
 *   and relation and gives it the same number, as long as the number is in
 *   simplest form (see `Semantic.util.isSimplifiedNumber`). So `x = 5/2` and
 *   `x = 2.5` match, while `x = 5 * 1/2` and `x = 10/4` don't. Answers that
 *   aren't numeric must be written the same way, up to term order, which
 *   side of a relation the variable is on, and the like.
 * - `'value'`: like `'form'`, but a numeric answer can be written any way,
 *   e.g. `x = 5 * 1/2`. Use this to accept a correct step whose answer isn't
 *   simplified yet.
 */
export type AnswerComparison = 'value' | 'form';

export type CheckStepOptions = {
  /** How to compare the solved answers. Defaults to `'form'`. */
  readonly answers?: AnswerComparison;
};

export type CheckStepResult =
  | {
      /** Both steps have the same solution. */
      readonly status: 'equivalent';
      readonly answer: Semantic.types.Node;
    }
  | {
      /** The steps have different solutions. */
      readonly status: 'not-equivalent';
      readonly prevAnswer: Semantic.types.Node;
      readonly nextAnswer: Semantic.types.Node;
    }
  | {
      /** The solver couldn't solve one of the steps, so we can't tell. */
      readonly status: 'unknown';
      readonly reason: string;
    };

type Solved =
  | {
      readonly kind: 'expression' | 'relation';
      readonly answer: Semantic.types.Node;
    }
  | { readonly kind: 'unsolved'; readonly reason: string };

const RELATION_TYPES: readonly string[] = [
  NodeType.Equals,
  NodeType.NotEquals,
  NodeType.LessThan,
  NodeType.LessThanOrEquals,
  NodeType.GreaterThan,
  NodeType.GreaterThanOrEquals,
];

const isNumericRelation = (
  node: Semantic.types.Node,
): node is Semantic.types.NumericRelation => RELATION_TYPES.includes(node.type);

const IGNORED_KEYS = ['id', 'loc', 'source', 'type', 'implicit', 'subtraction'];

const isNode = (value: unknown): value is Semantic.types.Node =>
  typeof value === 'object' && value !== null && 'type' in value;

/**
 * Rewrites `<` and `≤` as `>` and `≥` with their sides swapped, so that
 * `x < 3` and `3 > x` get the same canonical string. This only goes one way:
 * mapping `>` back to `<` as well would swap the two spellings instead of
 * making them match.
 */
const TO_GREATER_THAN: Readonly<Record<string, string>> = {
  [NodeType.LessThan]: NodeType.GreaterThan,
  [NodeType.LessThanOrEquals]: NodeType.GreaterThanOrEquals,
};

/**
 * Nodes whose children can appear in any order once they've been turned into
 * canonical strings. For `Add`, this relies on `canonicalString` ignoring the
 * `subtraction` flag: `x - 2` is `x + (-2)`, so its terms can be reordered to
 * `-2 + x` without changing its value. Sorting the raw nodes instead would move a
 * subtraction to the front, where it would read as a different expression.
 */
const UNORDERED: readonly string[] = [
  NodeType.Add,
  NodeType.Mul,
  NodeType.Equals,
  NodeType.NotEquals,
  // A quadratic's solutions, e.g. `x = -2, x = -3`.
  'Sequence',
];

const evalRelation = (
  relation: Semantic.types.NumericRelation,
): boolean | undefined => {
  if (relation.args.length !== 2) {
    return undefined;
  }
  try {
    const [left, right] = relation.args.map((arg) =>
      Semantic.util.evalNode(arg),
    );
    switch (relation.type) {
      case NodeType.Equals:
        return left.equals(right);
      case NodeType.NotEquals:
        return !left.equals(right);
      case NodeType.LessThan:
        return left.compare(right) < 0;
      case NodeType.LessThanOrEquals:
        return left.compare(right) <= 0;
      case NodeType.GreaterThan:
        return left.compare(right) > 0;
      case NodeType.GreaterThanOrEquals:
        return left.compare(right) >= 0;
      default:
        return undefined;
    }
  } catch {
    // evalNode throws on anything that isn't a number.
    return undefined;
  }
};

/**
 * Returns a string that's the same for two answers that differ only in ways
 * that don't change their meaning: term and factor order, which side of an
 * equation is which, implicit versus explicit multiplication, and whether a
 * negative was written as subtraction, and the order of a quadratic's
 * solutions. A relation with no variables, such as `0 = 0`, becomes `true`
 * or `false`.
 */
const canonicalString = (node: Semantic.types.Node): string => {
  if (node.type === NodeType.Identifier) {
    return node.name;
  }
  if (node.type === NodeType.Number) {
    return node.value;
  }
  if (isNumericRelation(node) && getVariableNames(node).size === 0) {
    const value = evalRelation(node);
    if (value !== undefined) {
      return String(value);
    }
  }

  let type: string = node.type;
  let children: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (IGNORED_KEYS.includes(key) || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      children.push(
        ...value.map((v) =>
          isNode(v) ? canonicalString(v) : JSON.stringify(v),
        ),
      );
    } else if (isNode(value)) {
      children.push(`${key}:${canonicalString(value)}`);
    } else {
      children.push(`${key}:${JSON.stringify(value)}`);
    }
  }

  if (type in TO_GREATER_THAN) {
    type = TO_GREATER_THAN[type];
    children = [...children].reverse();
  }
  if (UNORDERED.includes(type)) {
    children = [...children].sort();
  }
  return `(${type} ${children.join(' ')})`;
};

const getVariableNames = (node: Semantic.types.Node): Set<string> => {
  const names = new Set<string>();
  Semantic.util.traverse(node, {
    exit: (n) => {
      if (n.type === NodeType.Identifier) {
        names.add(n.name);
      }
    },
  });
  return names;
};

/**
 * Whether `answer` is fully solved for `variable`: the variable alone on one
 * side of each relation, or no variable at all. Quadratic equations give a
 * sequence of such relations.
 */
const isSolvedFor = (
  answer: Semantic.types.Node,
  variable: Semantic.types.Identifier,
): boolean => {
  if (answer.type === 'Sequence') {
    return answer.args.every((arg) => isSolvedFor(arg, variable));
  }
  if (!isNumericRelation(answer)) {
    return false;
  }
  if (getVariableNames(answer).size === 0) {
    return true;
  }
  if (answer.args.length !== 2) {
    return false;
  }
  const isVariable = (n: Semantic.types.Node): boolean =>
    n.type === NodeType.Identifier && n.name === variable.name;
  const [left, right] = answer.args;
  return (
    (isVariable(left) && !getVariableNames(right).has(variable.name)) ||
    (isVariable(right) && !getVariableNames(left).has(variable.name))
  );
};

/**
 * Returns the degree of `node` as a polynomial in `variable`, e.g. 2 for
 * `x^2 + 5x + 6`. Returns `undefined` if `node` isn't a polynomial in
 * `variable`, such as when the variable is in a denominator or an exponent.
 */
const polynomialDegree = (
  node: Semantic.types.Node,
  variable: Semantic.types.Identifier,
): number | undefined => {
  const hasVariable = (n: Semantic.types.Node): boolean =>
    getVariableNames(n).has(variable.name);

  const factorDegree = (factor: Semantic.types.Node): number | undefined => {
    if (!hasVariable(factor)) {
      return 0;
    }
    switch (factor.type) {
      case NodeType.Identifier:
        return 1;
      case NodeType.Neg:
        return factorDegree(factor.arg);
      case NodeType.Power: {
        const { base, exp } = factor;
        if (
          base.type === NodeType.Identifier &&
          exp.type === NodeType.Number &&
          Number.isInteger(Number(exp.value))
        ) {
          return Number(exp.value);
        }
        return undefined;
      }
      case NodeType.Div: {
        // A numeric denominator, as in `x / 2`, doesn't change the degree.
        const [numerator, denominator] = factor.args;
        return hasVariable(denominator) ? undefined : termDegree(numerator);
      }
      case NodeType.Mul:
      case NodeType.Add:
        return termDegree(factor);
      default:
        return undefined;
    }
  };

  // The degree of a sum is its highest-degree term. The degree of a product
  // is the sum of its factors' degrees, so `x * x` has degree 2.
  const termDegree = (term: Semantic.types.Node): number | undefined => {
    if (term.type === NodeType.Add) {
      let max = 0;
      for (const t of term.args) {
        const d = termDegree(t);
        if (d === undefined) {
          return undefined;
        }
        max = Math.max(max, d);
      }
      return max;
    }
    let total = 0;
    for (const factor of Semantic.util.getFactors(term)) {
      const d = factorDegree(factor);
      if (d === undefined) {
        return undefined;
      }
      total += d;
    }
    return total;
  };

  return termDegree(node);
};

const solveRelation = (
  relation: Semantic.types.NumericRelation,
  variable: Semantic.types.Identifier,
): Semantic.types.Node | undefined => {
  if (relation.args.length !== 2) {
    // Chained relations such as `1 < x < 3` aren't supported.
    return undefined;
  }

  // Move every term to the left and simplify, so that `x^2 + 5x = -6`
  // becomes `x^2 + 5x + 6`. This tells us the relation's degree, and it's
  // the `... = 0` form the quadratic solver needs.
  const [left, right] = relation.args;
  const difference = Semantic.builders.add([
    left,
    Semantic.builders.neg(right, true),
  ]);
  const simplified = Solver.solveProblem({
    type: 'SimplifyExpression',
    expression: difference,
  });
  const leftSide = simplified ? simplified.answer : difference;
  const degree = polynomialDegree(leftSide, variable);

  if (degree === 2) {
    // Only equations can be quadratic here; the solver doesn't handle
    // quadratic inequalities.
    if (relation.type !== NodeType.Equals) {
      return undefined;
    }
    const quadratic = Solver.solveProblem({
      type: 'SolveQuadraticEquation',
      relation: Semantic.builders.eq([leftSide, Semantic.builders.number('0')]),
      variable,
    });
    // Check the answer, since the solver can return a step that doesn't
    // isolate the variable.
    return quadratic && isSolvedFor(quadratic.answer, variable)
      ? quadratic.answer
      : undefined;
  }

  if (degree !== undefined && degree > 2) {
    // Neither solver handles cubics or higher.
    return undefined;
  }

  // Degree 0 or 1, or not a polynomial in the variable. The linear solver
  // handles terms on both sides, so give it the original relation.
  const linear = Solver.solveProblem({
    type: 'SolveLinearRelation',
    relation,
    variable,
  });
  // As above, the linear solver sometimes returns a relation it couldn't
  // solve, such as `-x > 2` (#704), so check that the variable is isolated.
  return linear && isSolvedFor(linear.answer, variable)
    ? linear.answer
    : undefined;
};

const solve = (
  node: Semantic.types.Node,
  variable: Semantic.types.Identifier | undefined,
): Solved => {
  if (isNumericRelation(node)) {
    if (!variable) {
      return {
        kind: 'unsolved',
        reason: 'relations must contain exactly one variable',
      };
    }
    const answer = solveRelation(node, variable);
    return answer
      ? { kind: 'relation', answer }
      : { kind: 'unsolved', reason: "the solver couldn't solve the relation" };
  }

  // `simplify` returns nothing when there's nothing left to simplify, in
  // which case the expression is its own answer.
  const solution = Solver.solveProblem({
    type: 'SimplifyExpression',
    expression: node,
  });
  return { kind: 'expression', answer: solution ? solution.answer : node };
};

/**
 * The inverse of each relation, for when its sides are swapped, so that
 * `3 > x` reads as `x < 3`.
 */
const SWAPPED: Readonly<Record<string, string>> = {
  [NodeType.Equals]: NodeType.Equals,
  [NodeType.NotEquals]: NodeType.NotEquals,
  [NodeType.LessThan]: NodeType.GreaterThan,
  [NodeType.LessThanOrEquals]: NodeType.GreaterThanOrEquals,
  [NodeType.GreaterThan]: NodeType.LessThan,
  [NodeType.GreaterThanOrEquals]: NodeType.LessThanOrEquals,
};

type Value = ReturnType<typeof Semantic.util.evalNode>;

/** A solved relation with the variable on the left, e.g. `x < 5/2`. */
type NumericAnswer = {
  readonly type: string;
  readonly variable: string;
  readonly value: Value;
  /** The side of the relation that gives the value, as written. */
  readonly node: Semantic.types.Node;
};

/**
 * Returns the exact value of `node`, or `undefined` if it isn't a number,
 * e.g. because it contains a variable or a power.
 */
const evalNumber = (node: Semantic.types.Node): Value | undefined => {
  try {
    return Semantic.util.evalNode(node);
  } catch {
    // evalNode throws on anything that isn't a number.
    return undefined;
  }
};

/**
 * Turns a solved relation such as `x = 5/2` or `2.5 > x` into a
 * `NumericAnswer`, with the variable moved to the left. A quadratic's
 * sequence of solutions gives one answer per solution. Returns `undefined`
 * if any relation doesn't have a variable alone on one side and a number on
 * the other.
 */
const toNumericAnswers = (
  node: Semantic.types.Node,
): NumericAnswer[] | undefined => {
  if (node.type === 'Sequence') {
    const answers: NumericAnswer[] = [];
    for (const arg of node.args) {
      const argAnswers = toNumericAnswers(arg);
      if (!argAnswers) {
        return undefined;
      }
      answers.push(...argAnswers);
    }
    return answers;
  }
  if (!isNumericRelation(node) || node.args.length !== 2) {
    return undefined;
  }
  const [left, right] = node.args;
  if (left.type === NodeType.Identifier) {
    const value = evalNumber(right);
    return (
      value && [{ type: node.type, variable: left.name, value, node: right }]
    );
  }
  if (right.type === NodeType.Identifier) {
    const value = evalNumber(left);
    return (
      value && [
        { type: SWAPPED[node.type], variable: right.name, value, node: left },
      ]
    );
  }
  return undefined;
};

/**
 * The numeric values in a solved answer as written, e.g. the `5/2` in
 * `x = 5/2`, or `undefined` if the answer isn't numeric.
 */
const numericAnswerNodes = (
  solved: Solved,
): readonly Semantic.types.Node[] | undefined => {
  if (solved.kind === 'unsolved') {
    return undefined;
  }
  if (solved.kind === 'expression') {
    return evalNumber(solved.answer) ? [solved.answer] : undefined;
  }
  return toNumericAnswers(solved.answer)?.map((answer) => answer.node);
};

/**
 * Whether each of `prev`'s answers matches a different one of `next`'s, in
 * any order, since a quadratic's solutions can be listed either way.
 */
const sameNumericAnswers = (
  prev: readonly NumericAnswer[],
  next: readonly NumericAnswer[],
): boolean => {
  if (prev.length !== next.length) {
    return false;
  }
  const unmatched = [...next];
  return prev.every((p) => {
    const index = unmatched.findIndex(
      (n) =>
        n.type === p.type &&
        n.variable === p.variable &&
        n.value.equals(p.value),
    );
    if (index === -1) {
      return false;
    }
    unmatched.splice(index, 1);
    return true;
  });
};

/**
 * Compares two solved answers by their numeric values. Returns `undefined`
 * when either answer isn't numeric, so the caller can fall back to comparing
 * them by form.
 *
 * `evalNode` works with exact fractions, and decimals such as `2.5` are
 * read exactly too, so equal values compare equal without a tolerance.
 */
const compareValues = (prev: Solved, next: Solved): boolean | undefined => {
  if (prev.kind === 'unsolved' || prev.kind !== next.kind) {
    return undefined;
  }
  if (prev.kind === 'expression') {
    const prevValue = evalNumber(prev.answer);
    const nextValue = evalNumber(next.answer);
    return prevValue && nextValue ? prevValue.equals(nextValue) : undefined;
  }
  const prevAnswers = toNumericAnswers(prev.answer);
  const nextAnswers = toNumericAnswers(next.answer);
  return prevAnswers && nextAnswers
    ? sameNumericAnswers(prevAnswers, nextAnswers)
    : undefined;
};

/**
 * Checks whether `next` is a valid step from `prev` by solving both and
 * comparing their solutions.
 *
 * Expressions are simplified. Equations and inequalities are solved for
 * their variable, so both must contain the same single variable. Steps
 * that the solver can't handle come back as `'unknown'` rather than
 * `'not-equivalent'`.
 *
 * `options.answers` sets how the solutions are compared; see
 * `AnswerComparison`. With `'form'`, the default, `2x + 5 = 10 -> x = 2.5`
 * is equivalent, because `2.5` has the same value as the solver's `5/2` and
 * is in simplest form, but `x + 3 = 5 -> x = 4/2` isn't, because `4/2`
 * isn't simplified. With `'value'`, both are equivalent.
 */
export const checkStep = (
  prev: Semantic.types.Node,
  next: Semantic.types.Node,
  options: CheckStepOptions = {},
): CheckStepResult => {
  const { answers = 'form' } = options;

  const prevVars = getVariableNames(prev);
  const nextVars = getVariableNames(next);

  let variable: Semantic.types.Identifier | undefined;
  if (prevVars.size === 1) {
    const [name] = prevVars;
    // A relation in `next` may have lost its variable, e.g. `0 = 0`, but it
    // can't have gained a different one.
    if (nextVars.size === 0 || (nextVars.size === 1 && nextVars.has(name))) {
      variable = Semantic.builders.identifier(name);
    }
  }

  const prevSolved = solve(prev, variable);
  if (prevSolved.kind === 'unsolved') {
    return { status: 'unknown', reason: prevSolved.reason };
  }
  const nextSolved = solve(next, variable);
  if (nextSolved.kind === 'unsolved') {
    return { status: 'unknown', reason: nextSolved.reason };
  }

  const sameValue = compareValues(prevSolved, nextSolved);
  let equivalent: boolean;
  if (sameValue === undefined) {
    // At least one answer isn't numeric, so compare how they're written.
    equivalent =
      prevSolved.kind === nextSolved.kind &&
      canonicalString(prevSolved.answer) === canonicalString(nextSolved.answer);
  } else if (answers === 'value') {
    equivalent = sameValue;
  } else {
    // With 'form', the values must match and `next` must be simplified.
    equivalent =
      sameValue &&
      (numericAnswerNodes(nextSolved) ?? []).every(
        Semantic.util.isSimplifiedNumber,
      );
  }
  if (equivalent) {
    return { status: 'equivalent', answer: prevSolved.answer };
  }

  return {
    status: 'not-equivalent',
    prevAnswer: prevSolved.answer,
    nextAnswer: nextSolved.answer,
  };
};
