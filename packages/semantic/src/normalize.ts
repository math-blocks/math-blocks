import { UnreachableCaseError } from '@math-blocks/core';

import { Node } from './types';

// TODO: add an option to normalize the printed AST
export const print = (ast: Node): string => {
  switch (ast.type) {
    case 'Identifier':
      return ast.name;
    case 'Number':
      return `${ast.value}`;
    case 'Neg': {
      const type = ast.subtraction ? 'neg.sub' : 'neg';
      return `(${type} ${print(ast.arg)})`;
    }
    case 'LogicalNot':
    case 'AbsoluteValue':
    case 'Ln':
    case 'Exp':
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
    case 'Parens':
    case 'Determinant':
    case 'Transpose':
      return `(${ast.type} ${print(ast.arg)})`;
    case 'Mul': {
      const type = ast.implicit ? 'mul.imp' : 'mul.exp';
      return `(${type} ${ast.args.map(print)})`;
    }
    // These nodes are commutative
    case 'Add':
    case 'PlusMinus':
    case 'MinusPlus':
    case 'Union':
    case 'SetIntersection':
    case 'Equals':
    case 'NotEquals':
    case 'LogicalAnd':
    case 'LogicalOr':
    case 'ExclusiveOr':
    case 'Biconditional': {
      const args = ast.args.map(print);
      args.sort();
      return `(${ast.type} ${args.join(' ')})`;
    }
    // These nodes are not commutative
    case 'Div': {
      const num = print(ast.args[0]);
      const den = print(ast.args[1]);
      // We do this minimize the size of the normalized form
      if (num === den) {
        return '1';
      }
      return `(${ast.type} ${num} ${den})`;
    }
    case 'Modulo':
    case 'Conditional':
    case 'LessThan':
    case 'LessThanOrEquals':
    case 'GreaterThan':
    case 'GreaterThanOrEquals':
    case 'Set':
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
    case 'ScalarProduct': {
      const args = ast.args.map(print);
      return `(${ast.type} ${args.join(' ')})`;
    }
    case 'Root': {
      const radicand = print(ast.radicand);
      const index = print(ast.index);
      return `(${ast.type} :radicand ${radicand} :index ${index})`;
    }
    case 'Power': {
      const base = print(ast.base);
      const exp = print(ast.exp);
      return `(${ast.type} :base ${base} :exp ${exp})`;
    }
    case 'Log': {
      const base = print(ast.base);
      const arg = print(ast.arg);
      return `(${ast.type} :base ${base} :arg ${arg})`;
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
    case 'EmptySet':
      return ast.type;
    case 'Function': {
      const func = print(ast.func);
      const args = ast.args.map(print);
      return `(Func ${func} ${args.join(' ')})`;
    }
    case 'Product':
    case 'Summation':
    case 'DefiniteIntegral': {
      const arg = print(ast.arg);
      const bvar = print(ast.bvar);
      const lower = print(ast.lower);
      const upper = print(ast.upper);
      return `(${ast.type} ${arg} :bvar ${bvar} :lower ${lower} :upper ${upper})`;
    }
    case 'Integral': {
      const arg = print(ast.arg);
      const bvar = print(ast.bvar);
      return `(${ast.type} ${arg} :bvar ${bvar})`;
    }
    case 'Limit': {
      const arg = print(ast.arg);
      const bvar = print(ast.bvar);
      const to = print(ast.to);
      return ast.approach
        ? `(${ast.type} ${arg} :bvar ${bvar} :to ${to} :approach ${ast.approach})`
        : `(${ast.type} ${arg} :bvar ${bvar} :to ${to})`;
    }
    case 'Derivative': {
      const arg = print(ast.arg);
      return ast.degree != undefined
        ? `(${ast.type} ${arg} :degree ${ast.degree})`
        : `(${ast.type} ${arg})`;
    }
    case 'PartialDerivative': {
      const arg = print(ast.arg);
      // TODO: sort these
      const bvars = ast.bvars.map(print).join(' ');
      const degrees = ast.degrees.map(print).join(' ');
      return `(${ast.type} ${arg} :bvars (${bvars}) :degrees (${degrees}))`;
    }
    case 'ElementOf':
    case 'NotElementOf': {
      const element = print(ast.element);
      const set = print(ast.set);
      return `(${ast.type} ${element} ${set})`;
    }
    case 'Vector': {
      const args = ast.args.map(print).join(' ');
      const dim = ast.dim;
      return `(${ast.type} ${args} :dim ${dim})`;
    }
    case 'Matrix': {
      const args = ast.args.map(print).join(' ');
      const rows = ast.rows;
      const cols = ast.cols;
      return `(${ast.type} ${args} :rows ${rows} :cols ${cols})`;
    }
    default: {
      throw new UnreachableCaseError(ast);
    }
  }
};
