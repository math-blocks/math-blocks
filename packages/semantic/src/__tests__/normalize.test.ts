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
      type: NodeType.Func,
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

  test('Integral', () => {
    const ast: Node = {
      type: NodeType.Integral,
      id: getId(),
      arg: builders.identifier('x'),
      bvar: builders.identifier('x'),
      limits: {
        lower: { value: builders.number('0'), inclusive: true },
        upper: { value: builders.number('1'), inclusive: true },
      },
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Integral x :bvar x :limits [0, 1])"`,
    );
  });

  test('Limit', () => {
    const ast: Node = {
      type: NodeType.Limit,
      id: getId(),
      arg: builders.div(builders.number('1'), builders.identifier('x')),
      bvar: builders.identifier('x'),
      value: builders.number('0'),
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Limit (Div 1 x) :bvar x :value 0)"`,
    );
  });

  test('Limit with direction', () => {
    const ast: Node = {
      type: NodeType.Limit,
      id: getId(),
      arg: builders.div(builders.number('1'), builders.identifier('x')),
      bvar: builders.identifier('x'),
      value: builders.number('0'),
      dir: 'plus',
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Limit (Div 1 x) :bvar x :value 0 :dir plus)"`,
    );
  });

  test('Derivative', () => {
    const ast: Node = {
      type: NodeType.Derivative,
      id: getId(),
      arg: builders.pow(builders.identifier('x'), builders.number('2')),
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Derivative (Power :base x :exp 2))"`,
    );
  });

  test('Derivative with degree', () => {
    const ast: Node = {
      type: NodeType.Derivative,
      id: getId(),
      arg: builders.pow(builders.identifier('x'), builders.number('2')),
      degree: 2,
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(Derivative (Power :base x :exp 2) :degree 2)"`,
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
      variables: [builders.identifier('x'), builders.identifier('y')],
    };
    expect(print(ast)).toMatchInlineSnapshot(
      `"(PartialDerivative (mul.exp (Power :base x :exp 3),(Power :base y :exp 2)) :variables (x y) :degrees (2 1))"`,
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

  test('LongAddition', () => {
    const ast: Node = {
      type: NodeType.LongAddition,
      id: getId(),
      terms: [],
      sum: [],
      carries: [],
    };
    expect(() => print(ast)).toThrowErrorMatchingInlineSnapshot(
      `"we don't handle serializing 'LongAddition' nodes yet"`,
    );
  });
});
