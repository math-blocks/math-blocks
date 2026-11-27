import { builders } from '..';
import { print } from '../normalize';
import { Node } from '../types';
import { NodeType } from '../enums';
import { getId } from '@math-blocks/core';

describe('normalize', () => {
  test('3 + 2 + 1', () => {
    const ast = builders.add([
      builders.number('3'),
      builders.number('2'),
      builders.number('1'),
    ]);
    expect(print(ast)).toEqual('(Add 1 2 3)');
  });

  test('c + b + a', () => {
    const ast = builders.add([
      builders.identifier('c'),
      builders.identifier('b'),
      builders.identifier('a'),
    ]);
    expect(print(ast)).toEqual('(Add a b c)');
  });

  test('1 + a + 2 + b', () => {
    const ast = builders.add([
      builders.number('1'),
      builders.identifier('a'),
      builders.number('2'),
      builders.identifier('b'),
    ]);
    expect(print(ast)).toEqual('(Add 1 2 a b)');
  });

  test('a - b + -c', () => {
    const ast = builders.add([
      builders.number('a'),
      builders.neg(builders.identifier('b'), true),
      builders.neg(builders.identifier('b'), false),
    ]);
    expect(print(ast)).toMatchInlineSnapshot(`"(Add (neg b) (neg.sub b) a)"`);
  });

  test('a^2 + b^2 + ab + a^2b + ab^2', () => {
    const ast = builders.add([
      builders.pow(builders.identifier('a'), builders.number('2')),
      builders.pow(builders.identifier('b'), builders.number('2')),
      builders.mul([builders.identifier('a'), builders.identifier('b')]),
      builders.mul([
        builders.pow(builders.identifier('a'), builders.number('2')),
        builders.identifier('b'),
      ]),
      builders.mul([
        builders.identifier('a'),
        builders.pow(builders.identifier('b'), builders.number('2')),
      ]),
    ]);
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Add (Power :base a :exp 2) (Power :base b :exp 2) (mul.exp (Power :base a :exp 2),b) (mul.exp a,(Power :base b :exp 2)) (mul.exp a,b))"`,
    );
  });

  test('1/a', () => {
    const ast = builders.div(builders.number('1'), builders.identifier('a'));
    expect(print(ast)).toEqual('(Div 1 a)');
  });

  test('(1+a)/(1+a)', () => {
    const ast = builders.div(
      builders.add([builders.number('1'), builders.identifier('a')]),
      builders.add([builders.number('1'), builders.identifier('a')]),
    );
    expect(print(ast)).toEqual('1');
  });

  test('n mod m', () => {
    const ast: Node = {
      type: NodeType.Modulo,
      id: getId(),
      args: [builders.identifier('n'), builders.identifier('m')],
    };
    expect(print(ast)).toMatchInlineSnapshot(`"(Modulo n m)"`);
  });

  test('root[n]{x}', () => {
    const ast = builders.root(builders.number('n'), builders.identifier('x'));
    expect(print(ast)).toMatchInlineSnapshot(`"(Root :radicand n :index x)"`);
  });

  test('log_n{a}', () => {
    const ast: Node = {
      type: NodeType.Log,
      id: getId(),
      base: builders.identifier('n'),
      arg: builders.identifier('a'),
    };
    expect(print(ast)).toEqual('(Log :base n :arg a)');
  });

  test('f(x)', () => {
    const ast: Node = {
      type: NodeType.Function,
      id: getId(),
      func: builders.identifier('f'),
      args: [builders.identifier('x')],
    };
    expect(print(ast)).toEqual('(Func f x)');
  });

  test('Pi', () => {
    const ast: Node = {
      type: NodeType.Pi,
      id: getId(),
    };
    expect(print(ast)).toMatchInlineSnapshot(`"Pi"`);
  });

  test('Reals', () => {
    const ast: Node = {
      type: NodeType.Reals,
      id: getId(),
    };
    expect(print(ast)).toMatchInlineSnapshot(`"Reals"`);
  });

  test('DefInt', () => {
    const ast: Node = {
      type: 'DefiniteIntegral',
      id: getId(),
      arg: builders.identifier('x'),
      bvar: builders.identifier('x'),
      lower: builders.number('0'),
      upper: builders.number('1'),
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(DefiniteIntegral x :bvar x :lower 0 :upper 1)"`,
    );
  });

  test('Limit', () => {
    const ast: Node = {
      type: NodeType.Limit,
      id: getId(),
      arg: builders.div(builders.number('1'), builders.identifier('x')),
      bvar: builders.identifier('x'),
      to: builders.number('0'),
      approach: 'both',
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Limit (Div 1 x) :bvar x :to 0 :approach both)"`,
    );
  });

  test('Limit with direction', () => {
    const ast: Node = {
      type: NodeType.Limit,
      id: getId(),
      arg: builders.div(builders.number('1'), builders.identifier('x')),
      bvar: builders.identifier('x'),
      to: builders.number('0'),
      approach: 'right',
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Limit (Div 1 x) :bvar x :to 0 :approach right)"`,
    );
  });

  test('Derivative', () => {
    const ast: Node = {
      type: NodeType.Derivative,
      id: getId(),
      arg: builders.pow(builders.identifier('x'), builders.number('2')),
      bvar: builders.identifier('x'),
      degree: builders.number('1'),
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Derivative (Power :base x :exp 2) :bvar x :degree 1)"`,
    );
  });

  test('Derivative with degree', () => {
    const ast: Node = {
      type: NodeType.Derivative,
      id: getId(),
      arg: builders.pow(builders.identifier('x'), builders.number('2')),
      bvar: builders.identifier('x'),
      degree: builders.number('2'),
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Derivative (Power :base x :exp 2) :bvar x :degree 2)"`,
    );
  });

  test('PartialDerivative', () => {
    const ast: Node = {
      type: NodeType.PartialDerivative,
      id: getId(),
      arg: builders.mul([
        builders.pow(builders.identifier('x'), builders.number('3')),
        builders.pow(builders.identifier('y'), builders.number('2')),
      ]),
      degrees: [builders.number('2'), builders.number('1')],
      bvars: [builders.identifier('x'), builders.identifier('y')],
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(PartialDerivative (mul.exp (Power :base x :exp 3),(Power :base y :exp 2)) :bvars (x y) :degrees (2 1))"`,
    );
  });

  test('ElementOf', () => {
    const ast: Node = {
      type: NodeType.ElementOf,
      id: getId(),
      element: builders.identifier('x'),
      set: builders.identifier('S'),
    };
    expect(print(ast)).toMatchInlineSnapshot(`"(ElementOf x S)"`);
  });
});

describe('normalize node types', () => {
  const a = builders.identifier('a');
  const b = builders.identifier('b');
  const c = builders.identifier('c');
  const x = builders.identifier('x');
  const one = builders.number('1');
  const n = builders.identifier('n');

  test('negation and subtraction', () => {
    expect(print(builders.neg(a))).toEqual('(neg a)');
    expect(print(builders.neg(a, true))).toEqual('(neg.sub a)');
  });

  test('explicit and implicit multiplication', () => {
    expect(print(builders.mul([a, b]))).toEqual('(mul.exp a,b)');
    expect(print(builders.mul([a, b], true))).toEqual('(mul.imp a,b)');
  });

  test('multiplication keeps the order of its factors', () => {
    expect(print(builders.mul([b, a]))).toEqual('(mul.exp b,a)');
  });

  test.each([
    ['unaryplusminus', 'UnaryPlusMinus'],
    ['unaryminusplus', 'UnaryMinusPlus'],
    ['not', 'LogicalNot'],
    ['abs', 'AbsoluteValue'],
    ['ln', 'Ln'],
    ['exp', 'Exp'],
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
    ['arsinh', 'ArSinh'],
    ['arcosh', 'ArCosh'],
    ['artanh', 'ArTanh'],
    ['arcoth', 'ArCoth'],
    ['arsech', 'ArSech'],
    ['arcsch', 'ArCsch'],
    ['parens', 'Parens'],
    ['determinant', 'Determinant'],
    ['transpose', 'Transpose'],
  ] as const)('unary %s', (name, type) => {
    const build = builders[name] as (arg: Node) => Node;
    expect(print(build(builders.add([b, a])))).toEqual(`(${type} (Add a b))`);
  });

  describe('commutative operations sort their arguments', () => {
    test.each([
      ['plusminus', 'PlusMinus'],
      ['minusplus', 'MinusPlus'],
      ['union', 'Union'],
      ['intersection', 'SetIntersection'],
      ['eq', 'Equals'],
      ['neq', 'NotEquals'],
      ['and', 'LogicalAnd'],
      ['or', 'LogicalOr'],
      ['xor', 'ExclusiveOr'],
    ] as const)('%s', (name, type) => {
      const build = builders[name] as (args: readonly Node[]) => Node;
      expect(print(build([c, a, b]))).toEqual(`(${type} a b c)`);
      expect(print(build([c, a, b]))).toEqual(print(build([b, c, a])));
    });

    test('biconditional', () => {
      expect(print(builders.equivalent(b, a))).toEqual('(Biconditional a b)');
    });
  });

  describe('non-commutative operations keep their argument order', () => {
    test.each([
      ['lt', 'LessThan'],
      ['lte', 'LessThanOrEquals'],
      ['gt', 'GreaterThan'],
      ['gte', 'GreaterThanOrEquals'],
      ['set', 'Set'],
      ['cartesianproduct', 'CartesianProduct'],
      ['subset', 'Subset'],
      ['propersubset', 'ProperSubset'],
      ['superset', 'Superset'],
      ['propersuperset', 'ProperSuperset'],
      ['sequence', 'Sequence'],
    ] as const)('%s', (name, type) => {
      const build = builders[name] as (args: readonly Node[]) => Node;
      expect(print(build([c, a, b]))).toEqual(`(${type} c a b)`);
    });

    test.each([
      ['mod', 'Modulo'],
      ['implies', 'Conditional'],
      ['setdiff', 'SetDifference'],
      ['notsubset', 'NotSubset'],
      ['notpropersubset', 'NotProperSubset'],
      ['notsuperset', 'NotSuperset'],
      ['notpropersuperset', 'NotProperSuperset'],
      ['vectorproduct', 'VectorProduct'],
      ['scalarproduct', 'ScalarProduct'],
    ] as const)('%s', (name, type) => {
      const build = builders[name] as (arg0: Node, arg1: Node) => Node;
      expect(print(build(b, a))).toEqual(`(${type} b a)`);
    });
  });

  test('power', () => {
    expect(print(builders.pow(x, builders.number('2')))).toEqual(
      '(Power :base x :exp 2)',
    );
  });

  test.each([
    ['infinity', 'Infinity'],
    ['pi', 'Pi'],
    ['e', 'E'],
    ['ellipsis', 'Ellipsis'],
    ['true', 'True'],
    ['false', 'False'],
    ['naturals', 'Naturals'],
    ['integers', 'Integers'],
    ['rationals', 'Rationals'],
    ['reals', 'Reals'],
    ['complexes', 'Complexes'],
    ['emptyset', 'EmptySet'],
  ] as const)('constant %s', (name, type) => {
    const build = builders[name] as () => Node;
    expect(print(build())).toEqual(type);
  });

  test('a function with several arguments', () => {
    const f = builders.identifier('f');
    expect(print(builders.function(f, [x, a]))).toEqual('(Func f x a)');
  });

  test.each([
    ['sum', 'Sum'],
    ['product', 'Product'],
  ] as const)('%s', (name, type) => {
    const ast = builders[name](
      builders.identifier('i'),
      builders.identifier('i'),
      one,
      n,
    );
    expect(print(ast)).toEqual(`(${type} i :bvar i :lower 1 :upper n)`);
  });

  test('indefinite integral', () => {
    expect(print(builders.integral(builders.pow(x, one), x))).toEqual(
      '(Integral (Power :base x :exp 1) :bvar x)',
    );
  });

  test('a limit without an approach direction', () => {
    const ast = {
      ...builders.limit(x, x, one, 'both'),
      approach: undefined,
    } as unknown as Node;
    expect(print(ast)).toEqual('(Limit x :bvar x :to 1)');
  });

  test('a derivative without a degree', () => {
    const ast = {
      ...builders.diff(builders.pow(x, one), x, one),
      degree: undefined,
    } as unknown as Node;
    expect(print(ast)).toEqual('(Derivative (Power :base x :exp 1) :bvar x)');
  });

  test('a derivative prints its variable and degree', () => {
    const ast = builders.diff(builders.pow(x, one), x, builders.number('2'));
    expect(print(ast)).toEqual(
      '(Derivative (Power :base x :exp 1) :bvar x :degree 2)',
    );
  });

  test('derivatives with different degrees normalize differently', () => {
    const first = builders.diff(builders.pow(x, one), x, one);
    const second = builders.diff(builders.pow(x, one), x, builders.number('2'));
    expect(print(first)).not.toEqual(print(second));
  });

  test('derivatives with respect to different variables normalize differently', () => {
    const y = builders.identifier('y');
    const dx = builders.diff(builders.mul([x, y]), x, one);
    const dy = builders.diff(builders.mul([x, y]), y, one);
    expect(print(dx)).not.toEqual(print(dy));
  });

  test('NotElementOf', () => {
    expect(print(builders.notin(x, builders.reals()))).toEqual(
      '(NotElementOf x Reals)',
    );
  });

  test('vector', () => {
    expect(print(builders.vector([a, b, c], 3))).toEqual(
      '(Vector a b c :dim 3)',
    );
  });

  test('matrix', () => {
    expect(print(builders.matrix([a, b, c, x], 2, 2))).toEqual(
      '(Matrix a b c x :rows 2 :cols 2)',
    );
  });

  test('nested expressions are normalized recursively', () => {
    const ast = builders.eq([
      builders.add([b, builders.mul([a, x], true)]),
      builders.div(builders.add([one, c]), builders.add([c, one])),
    ]);
    expect(print(ast)).toEqual('(Equals (Add (mul.imp a,x) b) 1)');
  });

  test('throws on an unknown node type', () => {
    const ast = { type: 'Unknown', id: getId() } as unknown as Node;
    expect(() => print(ast)).toThrow('Unreachable case');
  });
});
