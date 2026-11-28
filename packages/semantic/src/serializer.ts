import { UnreachableCaseError } from '@math-blocks/core';

import { NodeType } from './enums';
import { definitions } from './node-defs';
import type { Node } from './types';

const printArgs = (
  type: string,
  args: readonly Node[],
  serialize: (ast: Node) => string,
  indent: (str: string) => string,
): string => {
  const hasGrandchildren = args.some(
    (arg: Node) =>
      arg.type !== NodeType.Identifier && arg.type !== NodeType.Number,
  );

  if (hasGrandchildren) {
    return `(${type}\n${args
      .map((arg: Node) => indent(print(arg, serialize, indent)))
      .join('\n')})`;
  } else {
    return `(${type} ${args
      .map((arg: Node) => print(arg, serialize, indent))
      .join(' ')})`;
  }
};

const symbols = {
  [NodeType.Infinity]: '\u221e',
  [NodeType.Pi]: '\u03c0',
  E: 'e',
  [NodeType.Ellipsis]: '...', // TODO: replace with \u2026 or \u22ef
  [NodeType.True]: 'T',
  [NodeType.False]: 'F',
  [NodeType.Naturals]: '\u2115',
  [NodeType.Integers]: '\u2124',
  [NodeType.Rationals]: '\u211a',
  [NodeType.Reals]: '\u211d',
  [NodeType.Complexes]: '\u2102',
};

// TODO: figure out how to generate a serializer directly from the schema.
// Schema nodes can include additional metadata like which symbol to use for a
// node.
// TODO: capture serialize and indent in a closure so that we don't have
// pass them down to each call to `print`.
const print = (
  val: unknown,
  serialize: (ast: Node) => string,
  indent: (str: string) => string,
): string => {
  const ast = val as Node | undefined;
  if (ast == undefined) {
    return 'null';
  }
  switch (ast.type) {
    case 'Number': {
      return ast.value;
    }
    case 'Identifier': {
      if (ast.subscript) {
        return `(ident ${ast.name} ${print(ast.subscript, serialize, indent)})`;
      } else {
        return ast.name;
      }
    }
    case 'Neg': {
      const type = ast.subtraction ? 'neg.sub' : 'neg';
      return `(${type} ${print(ast.arg, serialize, indent)})`;
    }
    case 'UnaryPlusMinus':
    case 'UnaryMinusPlus':
    case 'Exp':
    case 'Ln':
    case 'Log':
    case 'Sin':
    case 'Cos':
    case 'Tan':
    case 'Cot':
    case 'Sec':
    case 'Csc':
    case 'ArcSin':
    case 'ArcCos':
    case 'ArcTan':
    case 'ArcCot':
    case 'ArcSec':
    case 'ArcCsc':
    case 'Sinh':
    case 'Cosh':
    case 'Tanh':
    case 'Coth':
    case 'Sech':
    case 'Csch':
    case 'ArcSinh':
    case 'ArcCosh':
    case 'ArcTanh':
    case 'ArcCoth':
    case 'ArcSech':
    case 'ArcCsch':
    case 'LogicalNot':
    case 'AbsoluteValue':
    case 'Parens':
    case 'Determinant':
    case 'Transpose':
      return `(${ast.type} ${print(ast.arg, serialize, indent)})`;
    case 'Mul': {
      const type = ast.implicit ? 'mul.imp' : 'mul.exp';
      return printArgs(type, ast.args, serialize, indent);
    }
    case 'Add':
    case 'Div':
    case 'Modulo':
    case 'LogicalAnd':
    case 'LogicalOr':
    case 'ExclusiveOr':
    case 'Conditional':
    case 'Biconditional':
    case 'Equals':
    case 'NotEquals':
    case 'LessThan':
    case 'LessThanOrEquals':
    case 'GreaterThan':
    case 'GreaterThanOrEquals':
    case 'Set':
    case 'Union':
    case 'SetIntersection':
    case 'SetDifference':
    case 'CartesianProduct':
    case 'Subset':
    case 'ProperSubset':
    case 'NotSubset':
    case 'NotProperSubset':
    case 'Superset':
    case 'ProperSuperset':
    case 'NotSuperset':
    case 'NotProperSuperset':
    case 'VectorProduct':
    case 'ScalarProduct':
    case 'Sequence':
      return printArgs(ast.type, ast.args, serialize, indent);
    case 'Root': {
      const radicand = print(ast.radicand, serialize, indent);
      const index = print(ast.index, serialize, indent);
      return `(${ast.type} :radicand ${radicand} :index ${index})`;
    }
    case 'Power': {
      const hasGrandchildren =
        (ast.base.type !== NodeType.Identifier &&
          ast.base.type !== NodeType.Number) ||
        (ast.exp.type !== NodeType.Identifier &&
          ast.exp.type !== NodeType.Number);
      const base = print(ast.base, serialize, indent);
      const exp = print(ast.exp, serialize, indent);
      return hasGrandchildren
        ? `(${ast.type}\n${indent(`:base ${base}`)}\n${indent(`:exp ${exp}`)})`
        : `(${ast.type} :base ${base} :exp ${exp})`;
    }
    case 'Infinity':
    case 'Pi':
    case 'E':
    case 'Ellipsis':
    case 'True':
    case 'False':
    case 'Naturals':
    case 'Integers':
    case 'Rationals':
    case 'Reals':
    case 'Complexes':
      return symbols[ast.type];
    case 'Function': {
      const func = print(ast.func, serialize, indent);
      const args = ast.args.map((arg) => print(arg, serialize, indent));
      return `(func ${func} ${args.join(' ')})`;
    }
    case 'Matrix': {
      const cells = ast.args
        .map((cell) => print(cell, serialize, indent))
        .join(' ');
      return `(${ast.type} ${cells})`;
    }
    case 'PlusMinus':
    case 'MinusPlus':
    case 'Product':
    case 'Sum':
    case 'Limit':
    case 'Derivative':
    case 'PartialDerivative':
    case 'Integral':
    case 'DefiniteIntegral':
    case 'ElementOf':
    case 'NotElementOf':
    case 'EmptySet':
    case 'Vector': {
      throw new Error(`we don't handle serializing '${ast.type}' nodes yet`);
    }
    default: {
      throw new UnreachableCaseError(ast);
    }
  }
};

// `definitions` has an entry for every kind of semantic node, whereas
// `NodeType` is missing some of them (e.g. 'Sequence').
const nodeTypes: ReadonlySet<string> = new Set(
  Object.values(definitions).map((def) => def.name),
);

/**
 * Returns true if `val` looks like a semantic node, i.e. it's an object whose
 * `type` is the name of one of the node definitions.  Checking the `type`
 * keeps this serializer from claiming nodes from other packages, such as the
 * editor's nodes, which also have a `type`.
 */
const test = (val: unknown): val is Node =>
  typeof val === 'object' &&
  val !== null &&
  'type' in val &&
  typeof val.type === 'string' &&
  nodeTypes.has(val.type);

/**
 * A jest snapshot serializer for semantic nodes.  It prints nodes as
 * s-expressions, e.g. `(Add x (neg.sub 5))`.  Register it with
 *
 *   expect.addSnapshotSerializer(serializer);
 */
export const serializer = {
  print: print,
  test: test,
};
