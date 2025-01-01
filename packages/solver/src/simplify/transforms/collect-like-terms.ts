import { types, builders, util, NodeType } from '@math-blocks/semantic';

import { getCoeff } from '../../solve-linear/util';
import type { Step } from '../../types';

import { simplifyMul } from '../util';

import { dropAddIdentity } from './drop-add-identity';

export function collectLikeTerms(node: types.Node): Step<types.Node> | void {
  if (node.type !== NodeType.Add) {
    return;
  }

  const substeps: Step<types.Node>[] = [];

  const newSum = subToAddNeg(node, substeps);
  const groups = getGroups(newSum.args);
  if ([...groups.values()].every((group) => group.length === 1)) {
    // There are no like terms to collect
    return;
  }
  const orderedSum = orderTerms(newSum, groups, substeps);

  if (!orderedSum) {
    return;
  }

  // TODO: check if two terms are the same and if so, cancel them directly
  // instead of subtracting and then dropping the zero.

  let newNode = groupTerms(orderedSum, groups, substeps);
  newNode = evaluteCoeffs(newNode, substeps);
  newNode = simplifyTerms(newNode, substeps);
  newNode = addNegToSub(newNode, substeps);

  const step = dropAddIdentity(newNode);
  if (step) {
    substeps.push(step);
    newNode = step.after;
  }

  return {
    message: 'collect like terms',
    before: node,
    after: newNode,
    substeps,
  };
}

type Groups = ReadonlyMap<types.Node | null, readonly types.Node[]>;

/**
 * Given an array of terms, it groups them in a map where the key is the variable
 * part of the term and the value is an array of all terms of that type.
 */
const getGroups = (terms: readonly types.Node[]): Groups => {
  const map = new Map<types.Node | null, types.Node[]>();

  for (const term of terms) {
    if (util.isNumber(term)) {
      const key = null;
      if (!map.has(key)) {
        map.set(null, [term]);
      } else {
        map.get(key)?.push(term);
      }
      continue;
    }

    const factors = fancyGetFactors(term);

    const nonNumericFactors = factors.filter((f) => !util.isNumber(f));
    const varPart = builders.mul(nonNumericFactors, true);

    let key: types.Node | null = null;
    for (const k of map.keys()) {
      if (util.deepEquals(k, varPart)) {
        key = k;
      }
    }
    if (!key) {
      map.set(varPart, [term]);
    } else {
      map.get(key)?.push(term);
    }
  }

  return map;
};

/**
 * Convert any subtraction with the `node` to be addition of the inverse, e.g.
 * a - b -> a + -b
 *
 * TODO: add a substep to get rid of double negatives if it exists
 *
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const subToAddNeg = (
  node: types.Add,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Add => {
  let changed = false;

  // step 0: convert subtraction to adding the inverse
  const newSum = builders.add(
    util.getTerms(node).map((term) => {
      if (util.isSubtraction(term)) {
        changed = true;
        return builders.neg(term.arg, false);
      }
      return term;
    }),
  ) as types.Add;

  if (changed) {
    substeps.push({
      message: 'subtraction is the same as adding the inverse',
      before: node,
      after: newSum,
      substeps: [],
    });
    return newSum;
  }

  return node;
};

/**
 * Reorder terms if necessary so that like terms are next to each other, e.g.
 * 2x + 3y + x -> 2x + x + 3y.
 *
 * @param node
 * @param groups
 * @param substeps this argument can be mutated by this function.
 */
const orderTerms = (
  node: types.Node,
  groups: Groups,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Node | undefined => {
  const keys = [...groups.keys()];

  // If all terms are numbers then don't do anything, let evalAdd handle it.
  if (keys.length === 1 && keys[0] === null) {
    return undefined;
  }

  let changed = false;
  const newTerms: types.Node[] = [];
  for (const values of groups.values()) {
    if (values.length > 1) {
      changed = true;
    }
    newTerms.push(...values);
  }

  if (!changed) {
    return undefined;
  }

  // It's possible that the terms were already ordered with like terms beside
  // each other.
  const orderedSum = builders.add(newTerms);
  if (!util.deepEquals(node, orderedSum)) {
    substeps.push({
      message: 'reorder terms so that like terms are beside each other',
      before: node,
      after: orderedSum,
      substeps: [],
    });
    return orderedSum;
  }

  return node;
};

const areAdditiveInverses = (left: types.Node, right: types.Node): boolean => {
  if (left.type === NodeType.Neg && util.deepEquals(left.arg, right)) {
    return true;
  }

  if (right.type === NodeType.Neg && util.deepEquals(left, right.arg)) {
    return true;
  }

  return false;
};

/**
 * This function always returns a new node.
 * @param node
 * @param groups
 * @param substeps this argument will be mutated by this function.
 */
const groupTerms = (
  node: types.Node,
  groups: Groups,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Node => {
  const newTerms: types.Node[] = [];
  for (const [key, values] of groups.entries()) {
    let newTerm: types.Node;
    if (key === null) {
      // group constants together
      newTerm = builders.add(values);
    } else if (
      values.length === 2 &&
      areAdditiveInverses(values[0], values[1])
    ) {
      // x + -x -> 0
      newTerm = builders.number('0');
    } else if (values.length > 1) {
      // ax + bx + ... -> (a + b + ...)x
      const coeffs = values.map(getCoeff);
      const coeff = builders.add(coeffs);
      newTerm = builders.mul([coeff, key], true);
    } else {
      // ax -> ax
      newTerm = values[0];
    }
    newTerms.push(newTerm);
  }

  const newNode = builders.add(newTerms);
  substeps.push({
    message: 'factor variable part of like terms',
    before: node,
    after: newNode,
    substeps: [],
  });

  return newNode;
};

/**
 * This function always returns a new node.
 * @param node
 * @param substeps this argument will be mutated by this function.
 */
const evaluteCoeffs = (
  node: types.Node,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Node => {
  const newTerms = util.getTerms(node).map((term) => {
    // What if there was a term that was initial a sum of numbers, we wouldn't?
    // Ideally we'd deal with it first, but we should try to be defensive and
    // make sure that we're only processing nodes created by the previous step.
    // Passthrough nodes should be ignored.
    if (term.type === NodeType.Add && term.args.every(util.isNumber)) {
      // number group
      return evalNode(term);
    } else if (term.type === NodeType.Mul && term.args.length === 2) {
      const [coeff, variable] = term.args;
      if (util.isNumber(coeff)) {
        const newCoeff = evalNode(coeff);
        // use simplifyMul here to handle situations where variable has more
        // than one factor
        return builders.mul([newCoeff, variable], true);
      }
    }

    // passthrough
    return term;
  });

  const newNode = builders.add(newTerms);
  substeps.push({
    message: 'compute new coefficients',
    before: node,
    after: newNode,
    substeps: [],
  });

  return newNode;
};

/**
 * If there are any terms like -1x or 1x convert them to -x and x respectively.
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const simplifyTerms = (
  node: types.Node,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Node => {
  let changed = false;
  // TODO: don't mark (-3)(x) -> -(3x) as a chnage since these these two
  // are printed to look exactly the same
  const newTerms = util.getTerms(node).map((term) => {
    if (term.type === NodeType.Mul) {
      // simplifyMul returns the same term if nothing changed
      // TODO: collect sub-steps here
      const newTerm = simplifyMul(term);
      if (newTerm !== term) {
        changed = true;
        return newTerm;
      }
    }
    return term;
  });

  if (changed) {
    const newNode = builders.add(newTerms);
    substeps.push({
      message: 'simplify terms',
      before: node,
      after: newNode,
      substeps: [],
    });
    return newNode;
  }

  return node;
};

/**
 * Convert the addition of an inverse to subtraction, e.g. a + -b -> a - b
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const addNegToSub = (
  node: types.Node,
  substeps: Step[], // eslint-disable-line functional/prefer-readonly-type
): types.Node => {
  let changed = false;
  const newTerms = util.getTerms(node).map((term, index) => {
    if (term.type === NodeType.Neg && index > 0) {
      changed = true;
      return builders.neg(term.arg, true);
    }
    return term;
  });

  if (changed) {
    const newNode = builders.add(newTerms);
    substeps.push({
      message: 'adding the inverse is the same as subtraction',
      before: node,
      after: newNode,
      substeps: [],
    });
    return newNode;
  }

  return node;
};

//
// Utility functions
//

const getFactors = (node: types.Node): OneOrMore<types.Node> => {
  if (node.type === NodeType.Neg) {
    return [builders.number('-1'), ...getFactors(node.arg)];
  } else {
    return node.type === NodeType.Mul ? node.args : [node];
  }
};

// TODO: add unit tests just for this
const fancyGetFactors = (arg: types.Node): readonly types.Node[] => {
  let factors: readonly types.Node[];

  // TODO: move this logic into `getFactors`.
  if (arg.type === NodeType.Div && util.isNumber(arg.args[1])) {
    const [num, den] = arg.args;
    factors = [
      ...getFactors(num),
      // convert division in to mul-by-reciprocal
      // TODO: make this a substep
      builders.div(builders.number('1'), den),
    ];
  } else if (arg.type === NodeType.Neg) {
    if (arg.arg.type === NodeType.Div && util.isNumber(arg.arg.args[1])) {
      const [num, den] = arg.arg.args;
      factors = [
        ...getFactors(num),
        // convert division in to mul-by-reciprocal
        // TODO: make this a substep
        builders.div(builders.number('1'), den),
      ];
    } else {
      factors = getFactors(arg.arg);
    }
  } else {
    factors = getFactors(arg);
  }

  return factors;
};

/**
 * Returns either a number, fraction (div), or negative (neg) node.
 */
const evalNode = (node: types.Node): types.Node => {
  const value = util.evalNode(node);

  const newValue =
    value.d === 1
      ? builders.number(value.n.toString())
      : builders.div(
          builders.number(value.n.toString()),
          builders.number(value.d.toString()),
        );

  return value.s === -1 ? builders.neg(newValue) : newValue;
};
