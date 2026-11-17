import { builders, util } from '../index';
import type * as types from '../types';
import type { Node } from '../types';

describe('util', () => {
  describe('isNumber', () => {
    test('positive numbers are numbers', () => {
      const ast = builders.number('2');
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('negative numbers are numbers', () => {
      const ast = builders.neg(builders.number('2'));
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('fractions containing only positive numbers are numbers', () => {
      const ast = builders.div(builders.number('2'), builders.number('3'));
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('fractions containing negative numbers are numbers', () => {
      const ast = builders.div(
        builders.neg(builders.number('2')),
        builders.number('3'),
      );
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('negative fractions are numbers', () => {
      const ast = builders.neg(
        builders.div(builders.number('2'), builders.number('3')),
      );
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('roots containing numbers are numbers', () => {
      const ast = builders.root(builders.number('2'), builders.number('2'));
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('multiplying two numbers is a number', () => {
      const ast = builders.mul([builders.number('2'), builders.number('2')]);
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('adding two numbers is a number', () => {
      const ast = builders.add([builders.number('2'), builders.number('3')]);
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('subtracting two numbers is a number', () => {
      const ast = builders.add([
        builders.number('2'),
        builders.neg(builders.number('3'), true),
      ]);
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('powers with a base and an exponent that are numbers are numbers', () => {
      const ast = builders.pow(builders.number('2'), builders.number('3'));
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('a square root of a number is a number', () => {
      const ast = builders.sqrt(builders.number('3'));
      expect(util.isNumber(ast)).toBeTruthy();
    });

    test('an identifier is not a number', () => {
      const ast = builders.identifier('a');
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a negative identifier is not a number', () => {
      const ast = builders.neg(builders.identifier('a'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a fraction containing an identifier is not a number', () => {
      const ast = builders.div(builders.identifier('a'), builders.number('2'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a square root of an identifier is not a number', () => {
      const ast = builders.sqrt(builders.identifier('x'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a root with an identifier as the radicand is not a number', () => {
      const ast = builders.root(builders.identifier('a'), builders.number('2'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a root with an identifier as the index is not a number', () => {
      const ast = builders.root(builders.number('3'), builders.identifier('n'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a power with an identifier as a base is not number', () => {
      const ast = builders.pow(builders.identifier('a'), builders.number('3'));
      expect(util.isNumber(ast)).toBeFalsy();
    });

    test('a power with an identifier as an exponent is not number', () => {
      const ast = builders.pow(builders.number('2'), builders.identifier('x'));
      expect(util.isNumber(ast)).toBeFalsy();
    });
  });
});

describe('util helpers', () => {
  const a = builders.identifier('a');
  const b = builders.identifier('b');
  const c = builders.identifier('c');
  const num = (value: string): types.Number | types.Neg =>
    builders.number(value);

  describe('isNumber', () => {
    test('sums of numbers are numbers', () => {
      expect(util.isNumber(builders.add([num('1'), num('2')]))).toBe(true);
    });

    test('a sum containing an identifier is not a number', () => {
      expect(util.isNumber(builders.add([num('1'), a]))).toBe(false);
    });

    test('a product containing an identifier is not a number', () => {
      expect(util.isNumber(builders.mul([num('2'), a]))).toBe(false);
    });

    test('other node types are not numbers', () => {
      expect(util.isNumber(builders.pi())).toBe(false);
      expect(util.isNumber(builders.sin(num('1')))).toBe(false);
    });
  });

  describe('isSubtraction and isNegative', () => {
    test('a subtraction', () => {
      const node = builders.neg(a, true);
      expect(util.isSubtraction(node)).toBe(true);
      expect(util.isNegative(node)).toBe(false);
    });

    test('a negation', () => {
      const node = builders.neg(a);
      expect(util.isSubtraction(node)).toBe(false);
      expect(util.isNegative(node)).toBe(true);
    });

    test('a node that is not a Neg node', () => {
      expect(util.isSubtraction(a)).toBe(false);
      expect(util.isNegative(a)).toBe(false);
    });
  });

  describe('getFactors', () => {
    test('returns the args of a Mul node', () => {
      expect(util.getFactors(builders.mul([a, b, c]))).toEqual([a, b, c]);
    });

    test('wraps any other node in an array', () => {
      expect(util.getFactors(a)).toEqual([a]);
      const sum = builders.add([a, b]);
      expect(util.getFactors(sum)).toEqual([sum]);
    });

    test('does not split up Neg nodes', () => {
      const neg = builders.neg(builders.mul([a, b]));
      expect(util.getFactors(neg)).toEqual([neg]);
    });
  });

  describe('getTerms', () => {
    test('returns the args of an Add node', () => {
      expect(util.getTerms(builders.add([a, b, c]))).toEqual([a, b, c]);
    });

    test('wraps any other node in an array', () => {
      expect(util.getTerms(a)).toEqual([a]);
      const product = builders.mul([a, b]);
      expect(util.getTerms(product)).toEqual([product]);
    });
  });

  describe('isNumeric', () => {
    test.each([
      ['Number', num('1')],
      ['Identifier', a],
      ['Pi', builders.pi()],
      ['Infinity', builders.infinity()],
      ['Ellipsis', builders.ellipsis()],
      ['Add', builders.add([a, b])],
      ['Mul', builders.mul([a, b])],
      ['Function', builders.function(builders.identifier('f'), [a])],
      ['Div', builders.div(a, b)],
      ['Modulo', builders.mod(a, b)],
      ['Root', builders.sqrt(a)],
      ['Power', builders.pow(a, b)],
      ['Log', builders.log(a, b)],
      ['Neg', builders.neg(a)],
      ['AbsoluteValue', builders.abs(a)],
      ['Product', builders.product(a, b, num('1'), c)],
      ['Limit', builders.limit(a, b, num('0'), 'both')],
      ['Derivative', builders.diff(a, b, num('1'))],
      ['PartialDerivative', builders.partialdiff(a, [b], [num('1')])],
      ['Integral', builders.integral(a, b)],
    ])('%s nodes are numeric', (_, node) => {
      expect(util.isNumeric(node)).toBe(true);
    });

    test.each([
      ['Equals', builders.eq([a, b])],
      ['LessThan', builders.lt([a, b])],
      ['LogicalAnd', builders.and([a, b])],
      ['True', builders.true()],
      ['Set', builders.set([a, b])],
      ['Reals', builders.reals()],
      ['Matrix', builders.matrix([a], 1, 1)],
    ])('%s nodes are not numeric', (_, node) => {
      expect(util.isNumeric(node)).toBe(false);
    });

    // TODO: isNumeric checks for NodeType.Summation ('Summation'), but
    // builders.sum() creates nodes with type 'Sum'.
    // https://github.com/math-blocks/math-blocks/issues/689
    test.skip('Sum nodes are numeric', () => {
      expect(util.isNumeric(builders.sum(a, b, num('1'), c))).toBe(true);
    });
  });

  describe('isNumericRelation', () => {
    test.each([
      ['Equals', builders.eq([a, b])],
      ['LessThan', builders.lt([a, b])],
      ['GreaterThan', builders.gt([a, b])],
      ['LessThanOrEquals', builders.lte([a, b])],
      ['GreaterThanOrEquals', builders.gte([a, b])],
    ])('%s is a numeric relation', (_, node) => {
      expect(util.isNumericRelation(node)).toBe(true);
    });

    test.each([
      ['NotEquals', builders.neq([a, b])],
      ['Subset', builders.subset([a, b])],
      ['Add', builders.add([a, b])],
    ])('%s is not a numeric relation', (_, node) => {
      expect(util.isNumericRelation(node)).toBe(false);
    });
  });

  describe('hasArgs', () => {
    test.each([
      ['Add', builders.add([a, b])],
      ['Mul', builders.mul([a, b])],
      ['Equals', builders.eq([a, b])],
      ['NotEquals', builders.neq([a, b])],
      ['LessThan', builders.lt([a, b])],
      ['LessThanOrEquals', builders.lte([a, b])],
      ['GreaterThan', builders.gt([a, b])],
      ['GreaterThanOrEquals', builders.gte([a, b])],
      ['Div', builders.div(a, b)],
    ])('%s has args', (_, node) => {
      expect(util.hasArgs(node)).toBe(true);
    });

    test.each([
      ['Identifier', a],
      ['Neg', builders.neg(a)],
      ['Power', builders.pow(a, b)],
      ['Union', builders.union([a, b])],
    ])('%s does not have args', (_, node) => {
      expect(util.hasArgs(node)).toBe(false);
    });
  });

  describe('deepEquals', () => {
    test('primitives', () => {
      expect(util.deepEquals(1, 1)).toBe(true);
      expect(util.deepEquals('a', 'a')).toBe(true);
      expect(util.deepEquals(1, 2)).toBe(false);
      expect(util.deepEquals(1, '1')).toBe(false);
      expect(util.deepEquals(null, null)).toBe(true);
      expect(util.deepEquals(null, {})).toBe(false);
    });

    test('arrays', () => {
      expect(util.deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(util.deepEquals([1, 2], [1, 2, 3])).toBe(false);
      expect(util.deepEquals([1, 2], [2, 1])).toBe(false);
      expect(util.deepEquals([1], 1)).toBe(false);
    });

    test('objects', () => {
      expect(
        util.deepEquals({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }),
      ).toBe(true);
      expect(util.deepEquals({ a: 1 }, { a: 2 })).toBe(false);
      expect(util.deepEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(util.deepEquals({ a: 1 }, { b: 1 })).toBe(false);
    });

    test('ignores undefined properties', () => {
      expect(util.deepEquals({ a: 1, b: undefined }, { a: 1 })).toBe(true);
      expect(util.deepEquals({ a: 1 }, { a: 1, b: undefined })).toBe(true);
    });

    test('ignores id, loc and source', () => {
      expect(
        util.deepEquals(
          { type: 'Identifier', name: 'x', id: 1, loc: 'a', source: 'x' },
          { type: 'Identifier', name: 'x', id: 2, loc: 'b' },
        ),
      ).toBe(true);
    });

    test('nodes built separately with the same structure are equal', () => {
      const node1 = builders.add([a, builders.mul([num('2'), b], true)]);
      const node2 = builders.add([
        builders.identifier('a'),
        builders.mul([num('2'), builders.identifier('b')], true),
      ]);
      expect(util.deepEquals(node1, node2)).toBe(true);
    });

    test('nodes with different structure are not equal', () => {
      expect(
        util.deepEquals(builders.mul([a, b]), builders.mul([a, b], true)),
      ).toBe(false);
      expect(util.deepEquals(builders.add([a, b]), builders.add([b, a]))).toBe(
        false,
      );
    });
  });

  describe('intersection', () => {
    test('returns the elements that appear in both arrays', () => {
      expect(util.intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    test('returns an empty array when nothing is shared', () => {
      expect(util.intersection([1, 2], [3, 4])).toEqual([]);
      expect(util.intersection([], [1])).toEqual([]);
    });

    test('each element in the second array is only matched once', () => {
      expect(util.intersection([1, 1, 1], [1, 1])).toEqual([1, 1]);
    });

    test('compares nodes structurally', () => {
      const result = util.intersection(
        [a, b, num('1')],
        [builders.identifier('b'), num('1')],
      );
      expect(result).toEqual([b, expect.objectContaining({ value: '1' })]);
      expect(result[0]).toBe(b);
    });
  });

  describe('difference', () => {
    test('returns the elements of the first array not in the second', () => {
      expect(util.difference([1, 2, 3], [2, 4])).toEqual([1, 3]);
    });

    test('returns everything when nothing is shared', () => {
      expect(util.difference([1, 2], [3])).toEqual([1, 2]);
      expect(util.difference([1, 2], [])).toEqual([1, 2]);
    });

    test('each element in the second array is only removed once', () => {
      expect(util.difference([1, 1, 1], [1])).toEqual([1, 1]);
    });

    test('compares nodes structurally', () => {
      expect(util.difference([a, b, c], [builders.identifier('b')])).toEqual([
        a,
        c,
      ]);
    });
  });

  describe('evalNode', () => {
    const value = (
      node: Node,
      options?: Parameters<typeof util.evalNode>[1],
    ): string => util.evalNode(node, options).toFraction();

    test('a number', () => {
      expect(value(num('3'))).toEqual('3');
      expect(value(num('0.5'))).toEqual('1/2');
    });

    test('a negative number', () => {
      expect(value(num('-3'))).toEqual('-3');
    });

    test('a sum', () => {
      expect(value(builders.add([num('1'), num('2'), num('3')]))).toEqual('6');
    });

    test('a difference', () => {
      expect(
        value(builders.add([num('1'), builders.neg(num('3'), true)])),
      ).toEqual('-2');
    });

    test('a product', () => {
      expect(value(builders.mul([num('2'), num('3'), num('4')]))).toEqual('24');
    });

    test('a fraction', () => {
      expect(value(builders.div(num('2'), num('6')))).toEqual('1/3');
    });

    test('nested expressions', () => {
      // (1/2 + 1/3) * -6 = -5
      const ast = builders.mul([
        builders.add([
          builders.div(num('1'), num('2')),
          builders.div(num('1'), num('3')),
        ]),
        num('-6'),
      ]);
      expect(value(ast)).toEqual('-5');
    });

    test('fractions are not evaluated when evalFractions is false', () => {
      expect(() =>
        value(builders.div(num('1'), num('2')), { evalFractions: false }),
      ).toThrow('cannot parse a number from Div node');
    });

    test('throws on nodes it cannot evaluate', () => {
      expect(() => value(a)).toThrow(
        'cannot parse a number from Identifier node',
      );
      expect(() => value(builders.add([num('1'), a]))).toThrow(
        'cannot parse a number from Identifier node',
      );
    });
  });

  test('normalize is re-exported from util', () => {
    expect(util.normalize(builders.add([b, a]))).toEqual('(Add a b)');
  });
});
