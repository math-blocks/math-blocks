import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

const { NodeType } = Semantic;

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

/** Relations that mean the same thing with their sides swapped. */
const FLIPPED: Readonly<Record<string, string>> = {
  [NodeType.LessThan]: NodeType.GreaterThan,
  [NodeType.LessThanOrEquals]: NodeType.GreaterThanOrEquals,
};

/** Nodes whose children can appear in any order. */
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
 * solutions. A relation with no variables, such as
 * `0 = 0`, becomes `true` or `false`.
 */
const canonicalKey = (node: Semantic.types.Node): string => {
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
        ...value.map((v) => (isNode(v) ? canonicalKey(v) : JSON.stringify(v))),
      );
    } else if (isNode(value)) {
      children.push(`${key}:${canonicalKey(value)}`);
    } else {
      children.push(`${key}:${JSON.stringify(value)}`);
    }
  }

  if (type in FLIPPED) {
    type = FLIPPED[type];
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
 * Returns a deep copy of `node`. Some solver functions modify the nodes they
 * are given, so each call gets its own copy.
 */
const copy = <T extends Semantic.types.Node>(node: T): T =>
  JSON.parse(JSON.stringify(node));

const solveRelation = (
  relation: Semantic.types.NumericRelation,
  variable: Semantic.types.Identifier,
): Semantic.types.Node | undefined => {
  const linear = Solver.solveProblem({
    type: 'SolveLinearRelation',
    relation: copy(relation),
    variable,
  });
  if (linear && isSolvedFor(linear.answer, variable)) {
    return linear.answer;
  }
  if (relation.type === NodeType.Equals && relation.args.length === 2) {
    // The quadratic solver expects `... = 0`, so move everything to the left
    // and simplify it first.
    const [left, right] = copy(relation).args;
    const difference = Semantic.builders.add([
      left,
      Semantic.builders.neg(right, true),
    ]);
    const simplified = Solver.solveProblem({
      type: 'SimplifyExpression',
      expression: difference,
    });
    const quadratic = Solver.solveProblem({
      type: 'SolveQuadraticEquation',
      relation: Semantic.builders.eq([
        simplified ? simplified.answer : difference,
        Semantic.builders.number('0'),
      ]),
      variable,
    });
    if (quadratic && isSolvedFor(quadratic.answer, variable)) {
      return quadratic.answer;
    }
  }
  return undefined;
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
    expression: copy(node),
  });
  return { kind: 'expression', answer: solution ? solution.answer : node };
};

/**
 * Checks whether `next` is a valid step from `prev` by solving both and
 * comparing their solutions.
 *
 * Expressions are simplified. Equations and inequalities are solved for
 * their variable, so both must contain the same single variable. Steps
 * that the solver can't handle come back as `'unknown'` rather than
 * `'not-equivalent'`.
 */
export const checkStep = (
  prev: Semantic.types.Node,
  next: Semantic.types.Node,
): CheckStepResult => {
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

  if (
    prevSolved.kind === nextSolved.kind &&
    canonicalKey(prevSolved.answer) === canonicalKey(nextSolved.answer)
  ) {
    return { status: 'equivalent', answer: prevSolved.answer };
  }

  return {
    status: 'not-equivalent',
    prevAnswer: prevSolved.answer,
    nextAnswer: nextSolved.answer,
  };
};
