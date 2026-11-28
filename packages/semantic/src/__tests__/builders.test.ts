import builders from '../builders';
import { NodeType } from '../enums';
import type { Node, SourceLocation } from '../types';

const x = builders.identifier('x');
const y = builders.identifier('y');
const z = builders.identifier('z');
const loc: SourceLocation = { path: [0, 1], start: 2, end: 5 };

describe('builders', () => {
  test('each node gets a unique numeric id', () => {
    const a = builders.identifier('a');
    const b = builders.identifier('a');
    const c = builders.number('1');

    expect(typeof a.id).toBe('number');
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
  });

  describe('identifier', () => {
    test('without a subscript', () => {
      expect(builders.identifier('a')).toEqual({
        type: 'Identifier',
        id: expect.any(Number),
        name: 'a',
        subscript: undefined,
        loc: undefined,
      });
    });

    test('with a subscript and a location', () => {
      const subscript = builders.number('1');
      const node = builders.identifier('a', subscript, loc);

      expect(node.subscript).toBe(subscript);
      expect(node.loc).toBe(loc);
    });
  });

  describe('number', () => {
    test('a non-negative number', () => {
      expect(builders.number('12.5', loc)).toEqual({
        type: NodeType.Number,
        id: expect.any(Number),
        value: '12.5',
        loc,
      });
    });

    test('a negative number is a Neg node wrapping a Number node', () => {
      const node = builders.number('-3');

      expect(node).toEqual({
        type: NodeType.Neg,
        id: expect.any(Number),
        arg: {
          type: NodeType.Number,
          id: expect.any(Number),
          value: '3',
          loc: undefined,
        },
        subtraction: false,
        loc: undefined,
      });
    });

    test('any remaining hyphens are replaced with minus signs', () => {
      const node = builders.number('1-2');

      expect(node).toMatchObject({ type: NodeType.Number, value: '1−2' });
    });
  });

  describe('function', () => {
    test('stores the function and its arguments', () => {
      const f = builders.identifier('f');
      const node = builders.function(f, [x, y], loc);

      expect(node).toEqual({
        type: 'Function',
        id: expect.any(Number),
        func: f,
        args: [x, y],
        loc,
      });
    });
  });

  describe('add', () => {
    test('no terms gives 0', () => {
      expect(builders.add([])).toMatchObject({
        type: NodeType.Number,
        value: '0',
      });
    });

    test('a single term is returned as is', () => {
      expect(builders.add([x])).toBe(x);
    });

    test('two or more terms give an Add node', () => {
      expect(builders.add([x, y, z], loc)).toEqual({
        type: NodeType.Add,
        id: expect.any(Number),
        args: [x, y, z],
        loc,
      });
    });
  });

  describe('mul', () => {
    test('no factors gives 1', () => {
      expect(builders.mul([])).toMatchObject({
        type: NodeType.Number,
        value: '1',
      });
    });

    test('a single factor is returned as is', () => {
      expect(builders.mul([x])).toBe(x);
    });

    test('two or more factors give an explicit Mul node by default', () => {
      expect(builders.mul([x, y])).toEqual({
        type: NodeType.Mul,
        id: expect.any(Number),
        implicit: false,
        args: [x, y],
        loc: undefined,
      });
    });

    test('implicit multiplication with a location', () => {
      expect(builders.mul([x, y], true, loc)).toMatchObject({
        type: NodeType.Mul,
        implicit: true,
        args: [x, y],
        loc,
      });
    });
  });

  describe('numRel', () => {
    test.each([
      NodeType.Equals,
      NodeType.LessThan,
      NodeType.LessThanOrEquals,
      NodeType.GreaterThan,
      NodeType.GreaterThanOrEquals,
    ] as const)('creates a %s node', (type) => {
      expect(builders.numRel([x, y], type)).toEqual({
        type,
        id: expect.any(Number),
        args: [x, y],
      });
    });

    test('keeps the location', () => {
      expect(builders.numRel([x, y], NodeType.Equals, loc).loc).toBe(loc);
    });
  });

  describe('neg', () => {
    test('negation by default', () => {
      expect(builders.neg(x)).toEqual({
        type: NodeType.Neg,
        id: expect.any(Number),
        arg: x,
        subtraction: false,
        loc: undefined,
      });
    });

    test('subtraction', () => {
      expect(builders.neg(x, true, loc)).toMatchObject({
        arg: x,
        subtraction: true,
        loc,
      });
    });
  });

  describe('root and sqrt', () => {
    test('root is not a square root by default', () => {
      const index = builders.number('3');

      expect(builders.root(x, index)).toEqual({
        type: NodeType.Root,
        id: expect.any(Number),
        radicand: x,
        index,
        sqrt: false,
        loc: undefined,
      });
    });

    test('sqrt is a root with index 2', () => {
      expect(builders.sqrt(x, loc)).toMatchObject({
        type: NodeType.Root,
        radicand: x,
        index: { type: NodeType.Number, value: '2' },
        sqrt: true,
        loc,
      });
    });
  });

  test('pow', () => {
    expect(builders.pow(x, y, loc)).toEqual({
      type: NodeType.Power,
      id: expect.any(Number),
      base: x,
      exp: y,
      loc,
    });
  });

  test('log', () => {
    expect(builders.log(x, y, loc)).toEqual({
      type: NodeType.Log,
      id: expect.any(Number),
      base: x,
      arg: y,
      loc,
    });
  });

  describe('unary operations', () => {
    test.each([
      ['unaryplusminus', 'UnaryPlusMinus'],
      ['unaryminusplus', 'UnaryMinusPlus'],
      ['abs', 'AbsoluteValue'],
      ['sin', 'Sin'],
      ['cos', 'Cos'],
      ['tan', 'Tan'],
      ['cot', 'Cot'],
      ['sec', 'Sec'],
      ['csc', 'Csc'],
      ['arcsin', 'ArcSin'],
      ['arccos', 'ArcCos'],
      ['arctan', 'ArcTan'],
      ['arccot', 'ArcCot'],
      ['arcsec', 'ArcSec'],
      ['arccsc', 'ArcCsc'],
      ['sinh', 'Sinh'],
      ['cosh', 'Cosh'],
      ['tanh', 'Tanh'],
      ['coth', 'Coth'],
      ['sech', 'Sech'],
      ['csch', 'Csch'],
      ['arcsinh', 'ArcSinh'],
      ['arccosh', 'ArcCosh'],
      ['arctanh', 'ArcTanh'],
      ['arccoth', 'ArcCoth'],
      ['arcsech', 'ArcSech'],
      ['arccsch', 'ArcCsch'],
      ['ln', 'Ln'],
      ['exp', 'Exp'],
      ['not', 'LogicalNot'],
      ['determinant', 'Determinant'],
      ['transpose', 'Transpose'],
      ['parens', 'Parens'],
    ] as const)('%s creates a %s node', (name, type) => {
      const build = builders[name] as (arg: Node, loc?: SourceLocation) => Node;

      expect(build(x)).toEqual({
        type,
        id: expect.any(Number),
        arg: x,
        loc: undefined,
      });
      expect(build(x, loc).loc).toBe(loc);
    });
  });

  describe('binary operations', () => {
    test.each([
      ['div', 'Div'],
      ['mod', 'Modulo'],
      ['implies', 'Conditional'],
      ['equivalent', 'Biconditional'],
      ['setdiff', 'SetDifference'],
      ['notsubset', 'NotSubset'],
      ['notpropersubset', 'NotProperSubset'],
      ['notsuperset', 'NotSuperset'],
      ['notpropersuperset', 'NotProperSuperset'],
      ['vectorproduct', 'VectorProduct'],
      ['scalarproduct', 'ScalarProduct'],
    ] as const)('%s creates a %s node', (name, type) => {
      const build = builders[name] as (
        arg0: Node,
        arg1: Node,
        loc?: SourceLocation,
      ) => Node;

      expect(build(x, y)).toEqual({
        type,
        id: expect.any(Number),
        args: [x, y],
        loc: undefined,
      });
      expect(build(x, y, loc).loc).toBe(loc);
    });
  });

  describe('n-ary operations and relations', () => {
    test.each([
      ['plusminus', 'PlusMinus'],
      ['minusplus', 'MinusPlus'],
      ['gt', 'GreaterThan'],
      ['gte', 'GreaterThanOrEquals'],
      ['lt', 'LessThan'],
      ['lte', 'LessThanOrEquals'],
      ['and', 'LogicalAnd'],
      ['or', 'LogicalOr'],
      ['xor', 'ExclusiveOr'],
      ['set', 'Set'],
      ['union', 'Union'],
      ['intersection', 'SetIntersection'],
      ['cartesianproduct', 'CartesianProduct'],
      ['subset', 'Subset'],
      ['propersubset', 'ProperSubset'],
      ['superset', 'Superset'],
      ['propersuperset', 'ProperSuperset'],
      ['sequence', 'Sequence'],
      ['eq', 'Equals'],
      ['neq', 'NotEquals'],
    ] as const)('%s creates a %s node', (name, type) => {
      const build = builders[name] as (
        args: readonly Node[],
        loc?: SourceLocation,
      ) => Node;

      expect(build([x, y, z])).toEqual({
        type,
        id: expect.any(Number),
        args: [x, y, z],
        loc: undefined,
      });
      expect(build([x, y], loc).loc).toBe(loc);
    });
  });

  describe('constants', () => {
    test.each([
      ['infinity', 'Infinity'],
      ['pi', 'Pi'],
      ['e', 'E'],
      ['ellipsis', 'Ellipsis'],
      ['true', 'True'],
      ['false', 'False'],
      ['emptyset', 'EmptySet'],
      ['naturals', 'Naturals'],
      ['integers', 'Integers'],
      ['rationals', 'Rationals'],
      ['reals', 'Reals'],
      ['complexes', 'Complexes'],
    ] as const)('%s creates a %s node', (name, type) => {
      const build = builders[name] as (loc?: SourceLocation) => Node;

      expect(build()).toEqual({
        type,
        id: expect.any(Number),
        loc: undefined,
      });
      expect(build(loc).loc).toBe(loc);
    });
  });

  describe('set membership', () => {
    test.each([
      ['in', 'ElementOf'],
      ['notin', 'NotElementOf'],
    ] as const)('%s creates a %s node', (name, type) => {
      const set = builders.reals();

      expect(builders[name](x, set, loc)).toEqual({
        type,
        id: expect.any(Number),
        element: x,
        set,
        loc,
      });
    });
  });

  describe('linear algebra', () => {
    test('matrix', () => {
      const entries = [x, y, z, x];

      expect(builders.matrix(entries, 2, 2, loc)).toEqual({
        type: 'Matrix',
        id: expect.any(Number),
        args: entries,
        rows: 2,
        cols: 2,
        loc,
      });
    });

    test('vector', () => {
      expect(builders.vector([x, y, z], 3, loc)).toEqual({
        type: 'Vector',
        id: expect.any(Number),
        args: [x, y, z],
        dim: 3,
        loc,
      });
    });
  });

  describe('calculus', () => {
    const zero = builders.number('0');
    const one = builders.number('1');

    test('limit', () => {
      expect(builders.limit(y, x, zero, 'left', loc)).toEqual({
        type: NodeType.Limit,
        id: expect.any(Number),
        arg: y,
        bvar: x,
        to: zero,
        approach: 'left',
        loc,
      });
    });

    test('integral', () => {
      expect(builders.integral(y, x, loc)).toEqual({
        type: NodeType.Integral,
        id: expect.any(Number),
        arg: y,
        bvar: x,
        loc,
      });
    });

    test('defint', () => {
      expect(builders.defint(y, x, zero, one, loc)).toEqual({
        type: 'DefiniteIntegral',
        id: expect.any(Number),
        arg: y,
        bvar: x,
        lower: zero,
        upper: one,
        loc,
      });
    });

    test('diff', () => {
      expect(builders.diff(y, x, one, loc)).toEqual({
        type: NodeType.Derivative,
        id: expect.any(Number),
        arg: y,
        bvar: x,
        degree: one,
        loc,
      });
    });

    test('partialdiff', () => {
      expect(builders.partialdiff(z, [x, y], [one, one], loc)).toEqual({
        type: NodeType.PartialDerivative,
        id: expect.any(Number),
        arg: z,
        bvars: [x, y],
        degrees: [one, one],
        loc,
      });
    });
  });

  describe('sequences and series', () => {
    const lower = builders.number('1');
    const upper = builders.identifier('n');

    test.each([
      ['sum', 'Sum'],
      ['product', 'Product'],
    ] as const)('%s creates a %s node', (name, type) => {
      expect(builders[name](y, x, lower, upper, loc)).toEqual({
        type,
        id: expect.any(Number),
        arg: y,
        bvar: x,
        lower,
        upper,
        loc,
      });
    });
  });
});
