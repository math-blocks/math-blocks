import { UnreachableCaseError } from '@math-blocks/core';

import { NodeType } from './enums';
import { Node, Limits } from './types';

const printLimits = (limits: Limits): string => {
  const { lower, upper } = limits;
  const left = lower.inclusive ? '[' : '(';
  const right = upper.inclusive ? ']' : ')';
  return `${left}${print(lower.value)}, ${print(upper.value)}${right}`;
};

// TODO: add an option to normalize the printed AST
export const print = (ast: Node): string => {
  switch (ast.type) {
    case NodeType.Identifier:
      return ast.name;
    case NodeType.Number:
      return `${ast.value}`;
    case NodeType.Neg: {
      const type = ast.subtraction ? 'neg.sub' : 'neg';
      return `(${type} ${print(ast.arg)})`;
    }
    case NodeType.LogicalNot:
    case NodeType.AbsoluteValue:
    case NodeType.Parens:
      return `(${ast.type} ${print(ast.arg)})`;
    case NodeType.Mul: {
      const type = ast.implicit ? 'mul.imp' : 'mul.exp';
      return `(${type} ${ast.args.map(print)})`;
    }
    // These nodes are commutative
    case NodeType.Add:
    case NodeType.PlusMinus:
    case NodeType.MinusPlus:
    case NodeType.Union:
    case NodeType.SetIntersection:
    case NodeType.Equals:
    case NodeType.NotEquals:
    case NodeType.LogicalAnd:
    case NodeType.LogicalOr:
    case NodeType.ExclusiveOr:
    case NodeType.Biconditional: {
      const args = ast.args.map(print);
      args.sort();
      return `(${ast.type} ${args.join(' ')})`;
    }
    // These nodes are not commutative
    case NodeType.Div: {
      const num = print(ast.args[0]);
      const den = print(ast.args[1]);
      // We do this minimize the size of the normalized form
      if (num === den) {
        return '1';
      }
      return `(${ast.type} ${num} ${den})`;
    }
    case NodeType.Modulo:
    case NodeType.Conditional:
    case NodeType.LessThan:
    case NodeType.LessThanOrEquals:
    case NodeType.GreaterThan:
    case NodeType.GreaterThanOrEquals:
    case NodeType.Set:
    case NodeType.SetDifference:
    case NodeType.CartesianProduct:
    case NodeType.Subset:
    case NodeType.ProperSubset:
    case NodeType.NotSubset:
    case NodeType.NotProperSubset: {
      const args = ast.args.map(print);
      return `(${ast.type} ${args.join(' ')})`;
    }
    case NodeType.Root: {
      const radicand = print(ast.radicand);
      const index = print(ast.index);
      return `(${ast.type} :radicand ${radicand} :index ${index})`;
    }
    case NodeType.Power: {
      const base = print(ast.base);
      const exp = print(ast.exp);
      return `(${ast.type} :base ${base} :exp ${exp})`;
    }
    case NodeType.Log: {
      const base = print(ast.base);
      const arg = print(ast.arg);
      return `(${ast.type} :base ${base} :arg ${arg})`;
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
    case NodeType.EmptySet:
      return ast.type;
    case NodeType.Func: {
      const func = print(ast.func);
      const args = ast.args.map(print);
      return `(Func ${func} ${args.join(' ')})`;
    }
    case NodeType.Product:
    case NodeType.Summation:
    case NodeType.Integral: {
      const arg = print(ast.arg);
      const bvar = print(ast.bvar);
      const limits = printLimits(ast.limits);
      return `(${ast.type} ${arg} :bvar ${bvar} :limits ${limits})`;
    }
    case NodeType.Limit: {
      const arg = print(ast.arg);
      const bvar = print(ast.bvar);
      const value = print(ast.value);
      return ast.dir
        ? `(${ast.type} ${arg} :bvar ${bvar} :value ${value} :dir ${ast.dir})`
        : `(${ast.type} ${arg} :bvar ${bvar} :value ${value})`;
    }
    case NodeType.Derivative: {
      const arg = print(ast.arg);
      return ast.degree != undefined
        ? `(${ast.type} ${arg} :degree ${ast.degree})`
        : `(${ast.type} ${arg})`;
    }
    case NodeType.PartialDerivative: {
      const arg = print(ast.arg);
      // TODO: sort these
      const variables = ast.variables.map(print).join(' ');
      const degrees = ast.degrees.map(print).join(' ');
      return `(${ast.type} ${arg} :variables (${variables}) :degrees (${degrees}))`;
    }
    case NodeType.ElementOf:
    case NodeType.NotElementOf: {
      const element = print(ast.element);
      const set = print(ast.set);
      return `(${ast.type} ${element} ${set})`;
    }
    case NodeType.LongAddition:
    case NodeType.LongSubtraction:
    case NodeType.LongMultiplication:
    case NodeType.LongDivision:
    case NodeType.VerticalAdditionToRelation: {
      throw new Error(`we don't handle serializing '${ast.type}' nodes yet`);
    }
    default: {
      throw new UnreachableCaseError(ast);
    }
  }
};
