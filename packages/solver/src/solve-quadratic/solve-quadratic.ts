import { builders, types, util } from '@math-blocks/semantic';

import type { Step } from '../types';
import { factor } from '../factor/factor';
import { simplify } from '../simplify/simplify';
import { solveLinear } from '../solve-linear/solve-linear';

const isZero = (node: types.Node): boolean =>
  node.type === 'Number' && node.value === '0';

const containsIdent = (node: types.Node, ident: types.Identifier): boolean => {
  let found = false;
  util.traverse(node, {
    exit: (n) => {
      if (n.type === 'Identifier' && n.name === ident.name) {
        found = true;
      }
    },
  });
  return found;
};

const isSolved = (
  relation: types.NumericRelation,
  ident: types.Identifier,
): boolean => {
  const [left, right] = relation.args as readonly types.Node[];
  return (
    left.type === 'Identifier' &&
    left.name === ident.name &&
    !containsIdent(right, ident)
  );
};

export function solveQuadratic(
  before: types.NumericRelation,
  ident: types.Identifier,
): Step | void {
  if (before.args.length !== 2) {
    return;
  }

  const relType = before.type;
  const substeps: Step[] = [];
  let [left, right] = before.args as readonly types.Node[];

  // Get the equation into the form `... = 0`. This is only needed when the
  // right side isn't already zero, e.g. `x^2 + 5x = -6`.
  if (!isZero(right)) {
    // Subtract each term on the right from the left, so `x^2 + 5x = -6`
    // becomes `x^2 + 5x + 6 = 0` rather than `(x^2 + 5x) - -6 = 0`.
    const negatedRight = util
      .getTerms(right)
      .map((term) =>
        term.type === 'Neg' && !term.subtraction
          ? term.arg
          : builders.neg(term.type === 'Neg' ? term.arg : term, true),
      );
    const moved = builders.numRel(
      [
        builders.add([...util.getTerms(left), ...negatedRight]),
        builders.number('0'),
      ],
      relType,
    );
    substeps.push({
      message: 'move all terms to one side',
      before: builders.numRel([left, right], relType),
      after: moved,
      substeps: [],
      section: true,
    });
    left = moved.args[0];
    right = moved.args[1];
  }

  // If the left side is already a product of factors that each contain the
  // variable, e.g. `(x + 2)(x + 3) = 0`, we can split it without expanding
  // and refactoring it.
  let factored: types.Mul;
  if (
    left.type === 'Mul' &&
    left.args.every((arg) => containsIdent(arg, ident))
  ) {
    factored = left;
  } else {
    // Simplify the left side when it needs it, e.g. after moving terms over
    // or when it's written as `x(x + 5) + 6`. `simplify` returns nothing if
    // there's nothing to do.
    const simplifyStep = simplify(left);
    if (simplifyStep) {
      substeps.push({
        message: 'simplify the left hand side',
        before: builders.numRel([left, right], relType),
        after: builders.numRel([simplifyStep.after, right], relType),
        substeps: simplifyStep.substeps,
        section: true,
      });
      left = simplifyStep.after;
    }

    if (left.type !== 'Add') {
      return;
    }

    const factorStep = factor(left);
    if (!factorStep) {
      return;
    }
    substeps.push({ ...factorStep, section: true });
    factored = factorStep.after as types.Mul;
  }

  const factors = factored.args;

  const relations = factors.map((factor) => {
    return builders.numRel([factor, builders.number('0')], relType);
  });

  // @ts-expect-error: TypeScript loses the TwoOrMore<Node> type after mapping
  const seq = builders.sequence(relations);
  const splitStep: Step = {
    message: 'split factored equation',
    before: builders.eq([factored, builders.number('0')]),
    after: seq,
    substeps: [],
  };

  substeps.push({ ...splitStep, section: true });

  const solutions: types.Node[] = [];
  for (const equation of relations) {
    // A factor that's just the variable, e.g. the `x` in `x(x + 5) = 0`,
    // gives `x = 0`, which is already solved.
    if (isSolved(equation, ident)) {
      solutions.push(equation);
      continue;
    }
    const step = solveLinear(equation as types.Eq, ident);
    // solveLinear can return a step that doesn't isolate the variable, e.g.
    // for `-x - 2 = 0` (#704). Bail out rather than return a wrong-looking
    // answer.
    if (!step || !isSolved(step.after as types.NumericRelation, ident)) {
      return undefined;
    }
    substeps.push({ ...step, section: true });
    solutions.push(step.after);
  }

  // @ts-expect-error: There isn't a way to tell TypeScript that solutions will
  // always have at least two items
  const after = builders.sequence(solutions);

  return {
    message: 'solve quadratic',
    before,
    after,
    substeps: substeps,
  };
}
