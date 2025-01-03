import { UnreachableCaseError } from '@math-blocks/core';
import * as Semantic from '@math-blocks/semantic';
import { NodeType } from '@math-blocks/semantic';

import * as types from './char/types';

export const toEqualMath = (
  received: Semantic.types.Node,
  actual: Semantic.types.Node,
): { readonly message: () => string; readonly pass: boolean } => {
  const message = 'Semantic trees did not match';
  if (Semantic.util.deepEquals(received, actual)) {
    return {
      message: () => message,
      pass: true,
    };
  }
  return {
    message: () => message,
    pass: false,
  };
};

// TODO: remove the ids from received and actual and then use the regular
// comparison method
export const toEqualEditorNode = (
  received: types.CharNode,
  actual: types.CharNode,
): { readonly message: () => string; readonly pass: boolean } => {
  const message = 'Semantic trees did not match';
  if (Semantic.util.deepEquals(received, actual)) {
    return {
      message: () => message,
      pass: true,
    };
  }
  return {
    message: () => message,
    pass: false,
  };
};

const printArgs = (
  type: string,
  args: readonly Semantic.types.Node[],
  serialize: (ast: Semantic.types.Node) => string,
  indent: (str: string) => string,
): string => {
  const hasGrandchildren = args.some(
    (arg: Semantic.types.Node) =>
      arg.type !== NodeType.Identifier && arg.type !== NodeType.Number,
  );

  if (hasGrandchildren) {
    return `(${type}\n${args
      .map((arg: Semantic.types.Node) => indent(print(arg, serialize, indent)))
      .join('\n')})`;
  } else {
    return `(${type} ${args
      .map((arg: Semantic.types.Node) => print(arg, serialize, indent))
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
  [NodeType.Rationals]: '\u221a',
  [NodeType.Reals]: '\u221d',
  [NodeType.Complexes]: '\u2102',
};

// TODO: figure out how to generate a serializer directly from the schema.
// Schema nodes can include additional metadata like which symbol to use for a
// node.
// TODO: capture serialize and indent in a closure so that we don't have
// pass them down to each call to `print`.
const print = (
  val: unknown,
  serialize: (ast: Semantic.types.Node) => string,
  indent: (str: string) => string,
): string => {
  const ast = val as Semantic.types.Node | undefined;
  if (ast == undefined) {
    return 'null';
  }
  switch (ast.type) {
    case 'Number': {
      return `${ast.value}`;
    }
    case 'Identifier': {
      if (ast.subscript) {
        return `(ident ${ast.name} ${print(ast.subscript, serialize, indent)})`;
      } else {
        return `${ast.name}`;
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

export const serializer = {
  print: print,
  test: (ast: Semantic.types.Node): boolean => !!ast.type,
};
