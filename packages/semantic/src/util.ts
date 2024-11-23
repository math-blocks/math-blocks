/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import Fraction from 'fraction.js';

import * as types from './types';
import { NodeType } from './enums';

export { print as normalize } from './normalize';

export const isSubtraction = (node: types.Node): node is types.Neg =>
  node.type === NodeType.Neg && node.subtraction;

export const isNegative = (node: types.Node): node is types.Neg =>
  node.type === NodeType.Neg && !node.subtraction;

export const getFactors = (node: types.Node): OneOrMore<types.Node> =>
  node.type === NodeType.Mul ? node.args : [node];

export const getTerms = (node: types.Node): OneOrMore<types.Node> =>
  node.type === NodeType.Add ? node.args : [node];

// TODO: create a function to check if an answer is simplified or not
// TODO: rename this to canBeEvaluated()
export const isNumber = (node: types.Node): boolean => {
  if (node.type === NodeType.Number) {
    return true;
  } else if (node.type === NodeType.Neg) {
    return isNumber(node.arg);
  } else if (node.type === NodeType.Div) {
    return node.args.every(isNumber);
  } else if (node.type === NodeType.Mul) {
    return node.args.every(isNumber);
  } else if (node.type === NodeType.Add) {
    return node.args.every(isNumber);
  } else if (node.type === NodeType.Root) {
    return isNumber(node.radicand) && isNumber(node.index);
  } else if (node.type === NodeType.Power) {
    return isNumber(node.base) && isNumber(node.exp);
  } else {
    return false;
  }
};

// TODO: autogenerate this from the validation schema
export const isNumeric = (node: types.Node): node is types.Node => {
  const NumericNodeTypes: NodeType[] = [
    NodeType.Number,
    NodeType.Identifier,
    NodeType.Pi,
    NodeType.Infinity,
    NodeType.Ellipsis,
    NodeType.Add,
    NodeType.Mul,
    NodeType.Func,
    NodeType.Div,
    NodeType.Modulo,
    NodeType.Root,
    NodeType.Power,
    NodeType.Log,
    NodeType.Neg,
    NodeType.AbsoluteValue,
    NodeType.Summation,
    NodeType.Product,
    NodeType.Limit,
    NodeType.Derivative,
    NodeType.PartialDerivative,
    NodeType.Integral,
  ];
  return NumericNodeTypes.includes(node.type);
};

export const isNumericRelation = (
  node: types.Node,
): node is types.NumericRelation => {
  return (
    node.type === NodeType.Equals ||
    // node.type === NodeType.NotEquals ||
    node.type === NodeType.LessThan ||
    node.type === NodeType.GreaterThan ||
    node.type === NodeType.LessThanOrEquals ||
    node.type === NodeType.GreaterThanOrEquals
  );
};

const isObject = (val: unknown): val is Record<string, unknown> => {
  return typeof val === 'object' && val != null;
};

export const deepEquals = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((val, index) => deepEquals(val, b[index]))
    );
  } else if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a).filter(
      (key) => key !== 'id' && key !== 'loc' && key !== 'source',
    );
    const bKeys = Object.keys(b).filter(
      (key) => key !== 'id' && key !== 'loc' && key !== 'source',
    );
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEquals(a[key], b[key]),
    );
  } else {
    return a === b;
  }
};

/**
 * Returns all of the elements that appear in both as and bs.
 */
export const intersection = <T>(
  as: readonly T[],
  bs: readonly T[],
): readonly T[] => {
  const result: T[] = [];
  for (const a of as) {
    // We use deepEquals here as an optimization.  If there are equivalent
    // nodes that aren't exactly the same between the as and bs then one of
    // out other checks will find it.
    const index = bs.findIndex((b) => deepEquals(a, b));
    if (index !== -1) {
      result.push(a);
      bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
    }
  }
  return result;
};

/**
 * Returns all of the elements that appear in as but not in bs.
 */
export const difference = <T>(
  as: readonly T[],
  bs: readonly T[],
): readonly T[] => {
  const result: T[] = [];
  for (const a of as) {
    // We use deepEquals here as an optimization.  If there are equivalent
    // nodes that aren't exactly the same between the as and bs then one of
    // out other checks will find it.
    const index = bs.findIndex((b) => deepEquals(a, b));
    if (index !== -1) {
      bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
    } else {
      result.push(a);
    }
  }
  return result;
};

export type HasArgs =
  | types.Add
  | types.Mul
  | types.Eq
  | types.Neq
  | types.Lt
  | types.Lte
  | types.Gt
  | types.Gte
  | types.Div;

export const hasArgs = (a: types.Node): a is HasArgs =>
  a.type === NodeType.Add ||
  a.type === NodeType.Mul ||
  a.type === NodeType.Equals ||
  a.type === NodeType.NotEquals ||
  a.type === NodeType.LessThan ||
  a.type === NodeType.LessThanOrEquals ||
  a.type === NodeType.GreaterThan ||
  a.type === NodeType.GreaterThanOrEquals ||
  a.type === NodeType.Div;

// TODO: dedupe with grader package
type Options = {
  readonly skipEvalChecker?: boolean;
  readonly evalFractions?: boolean;
};

// TODO: create a wrapper around this that returns a Semantic.Types.Node
// Right now we don't handle returning fractions in a lot of places.
export const evalNode = (
  node: types.Node,
  options: Options = {
    evalFractions: true,
  },
): Fraction => {
  if (node.type === NodeType.Number) {
    return new Fraction(node.value);
  } else if (node.type === NodeType.Neg) {
    return evalNode(node.arg, options).mul(new Fraction('-1'));
  } else if (node.type === NodeType.Div && options.evalFractions) {
    // TODO: add a recursive option as well
    return evalNode(node.args[0], options).div(evalNode(node.args[1], options));
  } else if (node.type === NodeType.Add) {
    return node.args.reduce(
      (sum, term) => sum.add(evalNode(term, options)),
      new Fraction('0'),
    );
  } else if (node.type === NodeType.Mul) {
    return node.args.reduce(
      (sum, factor) => sum.mul(evalNode(factor, options)),
      new Fraction('1'),
    );
  } else {
    throw new Error(`cannot parse a number from ${node.type} node`);
  }
};

/**
 * Traverse the nodes in a semantic tree.
 *
 * Traverse supports in place mutation of nodes within the tree.  If an `exit`
 * callback is provided that returns a value, the return value will replace
 * the node that was passed to it.
 */
export const traverse = (
  node: types.Node,
  callbacks: {
    readonly enter?: (node: types.Node) => void;
    readonly exit?: (node: types.Node) => types.Node | void;
  },
): types.Node => {
  if (callbacks.enter) {
    callbacks.enter(node);
  }

  const newValues: Record<string, types.Node | types.Node[]> = {};
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      // All arrays in the tree except for Location.path contain nodes.
      // Since we never pass a Location as an arg to traverse we should
      // be okey without doing additional checks.
      newValues[key] = value.map((child) => traverse(child, callbacks));
    } else if (value?.hasOwnProperty('type')) {
      newValues[key] = traverse(value as types.Node, callbacks);
    }
  }

  if (node.type === 'VerticalAdditionToRelation') {
    const newNode = {
      ...node,
      ...newValues,
      originalRelation: {
        left: node.originalRelation.left.map(
          (child) => child && traverse(child, callbacks),
        ),
        right: node.originalRelation.right.map(
          (child) => child && traverse(child, callbacks),
        ),
      },
      actions: {
        left: node.actions.left.map(
          (child) => child && traverse(child, callbacks),
        ),
        right: node.actions.right.map(
          (child) => child && traverse(child, callbacks),
        ),
      },
      resultingRelation: node.resultingRelation
        ? {
            left: node.resultingRelation.left.map(
              (child) => child && traverse(child, callbacks),
            ),
            right: node.resultingRelation.right.map(
              (child) => child && traverse(child, callbacks),
            ),
          }
        : undefined,
    } as types.Node;

    if (callbacks.exit) {
      const result = callbacks.exit(newNode);
      if (result) {
        return result;
      }
    }

    return newNode;
  } else {
    const newNode = {
      ...node,
      ...newValues,
    };

    if (callbacks.exit) {
      const result = callbacks.exit(newNode);
      if (result) {
        return result;
      }
    }

    return newNode;
  }
};

export const traverseNumeric = (
  node: types.Node,
  callbacks: {
    readonly enter?: (node: types.Node) => void;
    readonly exit?: (node: types.Node) => types.Node | void;
  },
): types.Node => {
  if (callbacks.enter) {
    callbacks.enter(node);
  }

  const newValues: Record<string, types.Node | types.Node[]> = {};
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      // All arrays in the tree except for Location.path contain nodes.
      // Since we never pass a Location as an arg to traverse we should
      // be okey without doing additional checks.
      newValues[key] = value.map((child) => traverseNumeric(child, callbacks));
    } else if (value?.hasOwnProperty('type')) {
      newValues[key] = traverseNumeric(value as types.Node, callbacks);
    }
  }

  const newNode = {
    ...node,
    ...newValues,
  };

  if (callbacks.exit) {
    const result = callbacks.exit(newNode);
    if (result) {
      return result;
    }
  }

  return newNode;
};
