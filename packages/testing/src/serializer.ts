// import {UnreachableCaseError} from "@math-blocks/core";
import * as Semantic from '@math-blocks/semantic';
import { UnreachableCaseError } from '@math-blocks/core';

const { NodeType } = Semantic;

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
  [NodeType.Ellipsis]: '...', // TODO: replace with \u2026 or \u22ef
  [NodeType.True]: 'T',
  [NodeType.False]: 'F',
  [NodeType.Naturals]: '\u2115',
  [NodeType.Integers]: '\u2124',
  [NodeType.Rationals]: '\u221a',
  [NodeType.Reals]: '\u221d',
  [NodeType.Complexes]: '\u2102',
};

type WorkRow = {
  readonly left: readonly (Semantic.types.NumericNode | null)[];
  readonly right: readonly (Semantic.types.NumericNode | null)[];
};

const printWorkRow = (
  workRow: WorkRow,
  serialize: (ast: Semantic.types.Node) => string,
  indent: (str: string) => string,
): string => {
  const leftArray = workRow.left.map((term) => print(term, serialize, indent));
  const rightArray = workRow.right.map((term) =>
    print(term, serialize, indent),
  );
  const leftStr =
    leftArray.length > 1 ? `(add ${leftArray.join(' ')})` : leftArray[0];
  const rightStr =
    rightArray.length > 1 ? `(add ${rightArray.join(' ')})` : rightArray[0];
  return `(eq ${leftStr} ${rightStr})`;
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
    case NodeType.Number: {
      return `${ast.value}`;
    }
    case NodeType.Identifier: {
      if (ast.subscript) {
        return `(ident ${ast.name} ${print(ast.subscript, serialize, indent)})`;
      } else {
        return `${ast.name}`;
      }
    }
    case NodeType.Neg: {
      const type = ast.subtraction ? 'neg.sub' : 'neg';
      return `(${type} ${print(ast.arg, serialize, indent)})`;
    }
    case NodeType.LogicalNot:
    case NodeType.AbsoluteValue:
    case NodeType.Parens:
      return `(${ast.type} ${print(ast.arg, serialize, indent)})`;
    case NodeType.Mul: {
      const type = ast.implicit ? 'mul.imp' : 'mul.exp';
      return printArgs(type, ast.args, serialize, indent);
    }
    case NodeType.Add:
    case NodeType.Div:
    case NodeType.Modulo:
    case NodeType.LogicalAnd:
    case NodeType.LogicalOr:
    case NodeType.ExclusiveOr:
    case NodeType.Conditional:
    case NodeType.Biconditional:
    case NodeType.Equals:
    case NodeType.NotEquals:
    case NodeType.LessThan:
    case NodeType.LessThanOrEquals:
    case NodeType.GreaterThan:
    case NodeType.GreaterThanOrEquals:
    case NodeType.Set:
    case NodeType.Union:
    case NodeType.SetIntersection:
    case NodeType.SetDifference:
    case NodeType.CartesianProduct:
    case NodeType.Subset:
    case NodeType.ProperSubset:
    case NodeType.NotSubset:
    case NodeType.NotProperSubset:
      return printArgs(ast.type, ast.args, serialize, indent);
    case NodeType.Root: {
      const radicand = print(ast.radicand, serialize, indent);
      const index = print(ast.index, serialize, indent);
      return `(${ast.type} :radicand ${radicand} :index ${index})`;
    }
    case NodeType.Power: {
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
    case NodeType.Infinity:
    case NodeType.Pi:
    case NodeType.Ellipsis:
    case NodeType.True:
    case NodeType.False:
    case NodeType.Naturals:
    case NodeType.Integers:
    case NodeType.Rationals:
    case NodeType.Reals:
    case NodeType.Complexes:
      return symbols[ast.type];
    case NodeType.VerticalAdditionToRelation: {
      const relOp = ast.relOp;
      const originalRelation = printWorkRow(
        ast.originalRelation,
        serialize,
        indent,
      );
      const actions = printWorkRow(ast.actions, serialize, indent);
      const resultingRelation = ast.resultingRelation
        ? printWorkRow(ast.resultingRelation, serialize, indent)
        : 'null';
      return `(${ast.type}\n${indent(`:relOp ${relOp}`)}\n${indent(
        `:originalRelation ${originalRelation}`,
      )}\n${indent(`:actions ${actions}`)}\n${indent(
        `:resultingRelation ${resultingRelation}`,
      )})`;
    }
    case NodeType.Func: {
      const func = print(ast.func, serialize, indent);
      const args = ast.args.map((arg) => print(arg, serialize, indent));
      return `(func ${func} ${args.join(' ')})`;
    }
    case NodeType.PlusMinus:
    case NodeType.MinusPlus:
    case NodeType.Product:
    case NodeType.Summation:
    case NodeType.Limit:
    case NodeType.Derivative:
    case NodeType.Integral:
    case NodeType.PartialDerivative:
    case NodeType.LongAddition:
    case NodeType.LongSubtraction:
    case NodeType.LongMultiplication:
    case NodeType.LongDivision:
    case NodeType.ElementOf:
    case NodeType.NotElementOf:
    case NodeType.EmptySet:
    case NodeType.Log: {
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
