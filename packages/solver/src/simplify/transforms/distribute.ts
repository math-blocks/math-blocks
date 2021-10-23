import * as Semantic from '@math-blocks/semantic';
import type { Mutable } from 'utility-types';

import { simplifyMul } from '../util';

import type { Step } from '../../types';

const { NodeType } = Semantic;

// a - (b + c) -> a + -1(b + c)
const distSub = (
  node: Semantic.types.Neg,
  substeps: Step<Semantic.types.NumericNode>[], // eslint-disable-line functional/prefer-readonly-type
): readonly Semantic.types.NumericNode[] | undefined => {
  const add = node.arg;
  const mulNegOne = Semantic.builders.mul(
    [Semantic.builders.number('-1'), add],
    true,
  ) as Semantic.types.Mul;
  // TODO: return new steps instead of mutating
  substeps.push({
    message: 'negation is the same as multipyling by one',
    before: node,
    after: mulNegOne,
    substeps: [],
  });
  return distMul(mulNegOne, substeps);
};

// a - b -> a + -b
const subToNeg = (
  before: Semantic.types.NumericNode,
  substeps: Step<Semantic.types.NumericNode>[], // eslint-disable-line functional/prefer-readonly-type
): Semantic.types.NumericNode => {
  if (Semantic.util.isSubtraction(before)) {
    const after = Semantic.builders.neg(before.arg, false);
    // TODO: return new steps instead of mutating
    substeps.push({
      message: 'subtraction is the same as adding the negative',
      before,
      after,
      substeps: [],
    });
    return after;
  }
  return before;
};

// a + -b -> a - b
const negToSub = (
  before: Semantic.types.NumericNode,
  index: number,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): Semantic.types.NumericNode => {
  if (before.type === NodeType.Neg && !before.subtraction && index > 0) {
    const after = Semantic.builders.neg(before.arg, true);
    // TODO: return new steps instead of mutating
    substeps.push({
      message: 'adding the negative is the same as subtraction',
      before,
      after,
      substeps: [],
    });
    return after;
  }
  return before;
};

// a(b + c) -> ab + bc
const distMul = (
  node: Semantic.types.Mul,
  substeps: Step<Semantic.types.NumericNode>[], // eslint-disable-line functional/prefer-readonly-type
): readonly Semantic.types.NumericNode[] | undefined => {
  // TODO: handle distribution of more than two polynomials
  if (node.args.length === 2) {
    if (node.args[1].type === NodeType.Add) {
      const add = node.args[1];

      // Convert subtraction to negative within the `add` node
      let changed = false;
      const terms = add.args.map((term) => {
        const result = subToNeg(term, substeps);
        // This works because subToNeg returns the original node if
        // nothing changes.
        if (result !== term) {
          changed = true;
        }
        return result;
      });

      // If we changed subtractions to negatives, create a new mul node
      // expressing that change
      const before = (
        changed
          ? Semantic.builders.mul(
              [node.args[0], Semantic.builders.add(terms)],
              true,
            )
          : node
      ) as Mutable<Semantic.types.Mul>;

      // HACK: In order for us to be able to apply the step, we need to
      // ensure that before.id is the same as node.id.  We create a new
      // `before` node instead of modifying the incoming `node` directly
      // to avoid hard to debut issues.
      before.id = node.id;

      // Finally, multiply each term in `before`
      const newNode = Semantic.builders.add(
        terms.map((term) => Semantic.builders.mul([node.args[0], term], true)),
      ) as Semantic.types.Add;

      // TODO: return new steps instead of mutating
      substeps.push({
        message: 'multiply each term',
        before,
        after: newNode,
        substeps: [],
      });

      return newNode.args.map((term) => {
        const newTerm = simplifyMul(term as Semantic.types.Mul, substeps);
        return newTerm;
      });
    } else if (node.args[0].type === NodeType.Add) {
      const add = node.args[0];

      // Convert subtraction to negative within the `add` node
      let changed = false;
      const terms = add.args.map((term) => {
        const result = subToNeg(term, substeps);
        // This works because subToNeg returns the original node if
        // nothing changes.
        if (result !== term) {
          changed = true;
        }
        return result;
      });

      // If we changed subtractions to negatives, create a new mul node
      // expressing that change
      const before = (
        changed
          ? Semantic.builders.mul(
              [Semantic.builders.add(terms), node.args[1]],
              true,
            )
          : node
      ) as Mutable<Semantic.types.Mul>;

      // HACK: In order for us to be able to apply the step, we need to
      // ensure that before.id is the same as node.id.  We create a new
      // `before` node instead of modifying the incoming `node` directly
      // to avoid hard to debut issues.
      before.id = node.id;

      // Finally, multiply each term in `before`
      const newNode = Semantic.builders.add(
        terms.map((term) => Semantic.builders.mul([term, node.args[1]], true)),
      ) as Semantic.types.Add;

      // TODO: return new steps instead of mutating
      substeps.push({
        message: 'multiply each term',
        before,
        after: newNode,
        substeps: [],
      });

      return newNode.args.map((term) => {
        const newTerm = simplifyMul(term as Semantic.types.Mul, substeps);
        return newTerm;
      });
    }
  }
  return undefined;
};

/**
 * If node is of the form a(b + c + ...) perform distribution on the node to
 * produce ab + ac + ....  If the node is a child of an 'add' node, the parent
 * should perform the distribution so that the new terms are part of that node.
 *
 * This function handles cases involving negatives and subtraction, creating
 * appropriate substeps along the way.
 *
 * If the node can be transform a Step object is returned, otherwise we return
 * undefined.
 *
 * @param node The node to transform.
 * @param path An array of nodes that were traversed to get to `node`.
 * @return {Step | undefined}
 */
export function distribute(
  node: Semantic.types.NumericNode,
  path: readonly Semantic.types.NumericNode[],
): Step<Semantic.types.NumericNode> | void {
  if (!Semantic.util.isNumeric(node)) {
    return;
  }

  const parent = path[path.length - 1];
  if (node.type === NodeType.Mul && parent && parent.type === NodeType.Add) {
    // The parent handles the distribution in this cases to ensure that
    // 1 + 2(x + 1) -> 1 + 2x + 2 instead of 1 + (2x + 2).  Drop parens
    // would eliminate the parentheses but it's not normally how a human
    // would show their work.
    return undefined;
  }
  if (node.type === NodeType.Neg && parent && parent.type === NodeType.Add) {
    // The parent handles the distribution in this cases to ensure that
    // 1 + 2(x + 1) -> 1 + 2x + 2 instead of 1 + (2x + 2).  Drop parens
    // would eliminate the parentheses but it's not normally how a human
    // would show their work.
    return undefined;
  }

  const substeps: Step<Semantic.types.NumericNode>[] = [];
  const nodes = Semantic.util.getTerms(node);
  let changed = false;
  const newNodes = nodes.flatMap((node, outerIndex) => {
    // Only distribute one term at a time.
    if (changed) {
      return [node];
    }

    let newTerms: readonly Semantic.types.NumericNode[] | undefined;
    if (node.type === NodeType.Neg) {
      newTerms = distSub(node, substeps);
    } else if (node.type === NodeType.Mul) {
      newTerms = distMul(node, substeps);
    }

    if (newTerms) {
      newTerms = newTerms.map((term, innerIndex) =>
        negToSub(term, outerIndex + innerIndex, substeps),
      );
      changed = true;
      return newTerms;
    }

    return [node];
  });

  if (!changed) {
    return undefined;
  }

  const after = Semantic.builders.add(newNodes);

  return {
    message: 'distribute',
    before: node,
    after,
    substeps,
  };
}
