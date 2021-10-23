import * as Testing from '@math-blocks/testing';

import { MistakeId } from '../../enums';

import {
  checkStep,
  checkMistake,
  toParseLike,
  toHaveStepsLike,
  toHaveMessages,
} from '../test-util';

expect.addSnapshotSerializer(Testing.serializer);

expect.extend({ toParseLike, toHaveStepsLike, toHaveMessages });

// TODO: split this in separate files so that it parallelizes better
describe('Axiom checks', () => {
  describe('symmetricProperty', () => {
    it('a = 3 -> 3 = a', () => {
      const result = checkStep('a = 3', '3 = a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['symmetric property']);
    });

    it('a = b = c -> b = c = a', () => {
      const result = checkStep('a = b = c', 'b = c = a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['symmetric property']);
    });

    it('a = b + 0 = c + 0 -> b = c = a', () => {
      const result = checkStep('a = b + 0 = c + 0', 'b = c = a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'addition with identity',
        'addition with identity',
        'symmetric property',
      ]);

      expect(result).toHaveStepsLike([
        ['b + 0', 'b'],
        ['c + 0', 'c'],
        ['a = b = c', 'b = c = a'],
      ]);
    });

    it('a = 1 + 2 -> 3 = a', () => {
      const result = checkStep('a = 1 + 2', '3 = a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'evaluation of addition',
        'symmetric property',
      ]);
    });

    it('x = x + 0 -> x + 0 = x', () => {
      const result = checkStep('x = x + 0', 'x + 0 = x');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['symmetric property']);
    });

    it('x = y + 0 -> y = x * 1', () => {
      const result = checkStep('x = y + 0', 'y = x * 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'addition with identity',
        'multiplication with identity',
        'symmetric property',
      ]);
    });
  });

  describe('commuteAddition', () => {
    it('1 + 2 -> 2 + 1', () => {
      const result = checkStep('1 + 2', '2 + 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('(2 - 1) + (1 + 1) -> 2 + 1', () => {
      const result = checkStep('(2 - 1) + (1 + 1)', '2 + 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        // TODO: change the message to "evaluation of subtraction"
        'evaluation of addition',
        'evaluation of addition',
        'commutative property',
      ]);

      expect(result).toHaveStepsLike([
        ['2 - 1', '1'],
        ['1 + 1', '2'],
        ['1 + 2', '2 + 1'],
      ]);
    });

    // nested commutative property
    it('(1 + 2) + (a + b) -> (2 + 1) + (b + a)', () => {
      const result = checkStep('(1 + 2) + (a + b)', '(b + a) + (2 + 1)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'commutative property',
        'commutative property',
        'commutative property',
      ]);
    });

    it('1 + 2 + 3 + 4 -> 6 [incorrect]', () => {
      expect(() => checkStep('1 + 2 + 3 + 4', '6')).toThrow();
    });

    // commutative property with additive identity
    it('2 + 0 -> 0 + 2', () => {
      const result = checkStep('2 + 0', '0 + 2');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('x + (a + 2) -> x + (2 + a)', () => {
      const result = checkStep('x + (a + 2)', 'x + (2 + a)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('x + a + 2 -> x + 2 + a', () => {
      const result = checkStep('x + a + 2', 'x + 2 + a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('x + a + 2 -> a + x + 2', () => {
      const result = checkStep('x + a + 2', 'a + x + 2');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('x + a + 2 -> x + 2 + b [incorrect step]', () => {
      expect(() => checkStep('x + a + 2', 'x + 2 + b')).toThrow();
    });
  });

  describe('commuteMultiplication', () => {
    // commutative property with multiplicative identity
    it('1 * 2 -> 2 * 1', () => {
      const result = checkStep('1 * 2', '2 * 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('2 * 3 -> 3 * 2', () => {
      const result = checkStep('2 * 3', '3 * 2');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['commutative property']);
    });

    it('(1 + 1) * (1 + 2) -> 3 * 2', () => {
      const result = checkStep('(1 + 1) * (1 + 2)', '3 * 2');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'evaluation of addition',
        'evaluation of addition',
        'commutative property',
      ]);

      expect(result).toHaveStepsLike([
        ['1 + 1', '2'],
        ['1 + 2', '3'],
        ['2 * 3', '3 * 2'],
      ]);
    });

    it('3 * 2 -> (1 + 1) * (1 + 2)', () => {
      const result = checkStep('3 * 2', '(1 + 1) * (1 + 2)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'decompose sum',
        'decompose sum',
        'commutative property',
      ]);

      expect(result).toHaveStepsLike([
        ['3', '1 + 2'],
        ['2', '1 + 1'],
        ['(1 + 2) * (1 + 1)', '(1 + 1) * (1 + 2)'],
      ]);
    });
  });

  describe('addZero', () => {
    it('a + 0 -> a', () => {
      const result = checkStep('a + 0', 'a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    it('2(a + 0) -> 2a', () => {
      const result = checkStep('2(a + 0)', '2a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    it('a -> a + 0', () => {
      const result = checkStep('a', 'a + 0');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    // nesting
    it('(a + b + 0) + c + 0 -> (a + b) + c', () => {
      const result = checkStep('(a + b + 0) + c + 0', '(a + b) + c');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'addition with identity',
        'addition with identity',
      ]);
    });

    // nesting in reverse
    it('(a + b) + c -> (a + b + 0) + c + 0', () => {
      const result = checkStep('(a + b) + c', '(a + b + 0) + c + 0');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'addition with identity',
        'addition with identity',
      ]);
    });

    it('2a -> 2(a + 0)', () => {
      const result = checkStep('2a', '2(a + 0)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    it('2a -> 2(a + 7)', () => {
      const mistakes = checkMistake('2a', '2(a + 7)');

      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
      expect(mistakes[0].prevNodes).toHaveLength(0);
      expect(mistakes[0].nextNodes[0]).toParseLike('7');
      expect(mistakes[0].nextNodes).toHaveLength(1);
    });

    it('2(a + 7) -> 2a', () => {
      const mistakes = checkMistake('2(a + 7)', '2a');

      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
      expect(mistakes[0].prevNodes[0]).toParseLike('7');
      expect(mistakes[0].prevNodes).toHaveLength(1);
      expect(mistakes[0].nextNodes).toHaveLength(0);
    });

    it('2a + 2b -> 2(a + 7) + 2(b + 3)', () => {
      const mistakes = checkMistake('2a + 2b', '2(a + 7) + 2(b + 3)');

      expect(mistakes).toHaveLength(2);

      expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
      expect(mistakes[0].nextNodes[0]).toParseLike('7');
      expect(mistakes[0].nextNodes).toHaveLength(1);
      expect(mistakes[0].prevNodes).toHaveLength(0);

      expect(mistakes[1].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
      expect(mistakes[1].nextNodes[0]).toParseLike('3');
      expect(mistakes[1].nextNodes).toHaveLength(1);
      expect(mistakes[1].prevNodes).toHaveLength(0);
    });

    it('a + b -> a + b + 0', () => {
      const result = checkStep('a + b', 'a + b + 0');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    it('a + b -> a + 0 + b', () => {
      const result = checkStep('a + b', 'a + 0 + b');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    it('a + b -> b + a + 0 -> b + 0 + a', () => {
      const result = checkStep('a + b', 'b + 0 + a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'commutative property',
        'addition with identity',
        // TODO: we're missing another "commutative property" step here
      ]);

      expect(result).toHaveStepsLike([
        ['a + b', 'b + a'],
        ['b + a', 'b + 0 + a'],
      ]);
    });

    it('a + b -> a + 0 + b + 0', () => {
      const result = checkStep('a + b', 'a + 0 + b + 0');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });

    // TODO: re-enable this once we're accumulating mistakes in the context
    it.skip('a + b -> a + b + 7', () => {
      const result = checkStep('a + b', 'a + b + 7');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['adding a non-zero valid is not allowed']);
    });

    // TODO: reenable this test once we're able to handle adding/removing
    // parens
    it.skip('0 + (a + b) -> a + b', () => {
      const result = checkStep('0 + (a + b)', 'a + b');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['addition with identity']);
    });
  });

  describe('mulOne', () => {
    it('1 * a -> a', () => {
      const result = checkStep('1 * a', 'a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication with identity']);
    });

    it('a -> a * 1', () => {
      const result = checkStep('a', 'a * 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication with identity']);
    });

    it('1 * (a * b) -> a * b', () => {
      const result = checkStep('1 * (a * b)', 'a * b');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication with identity']);
    });

    it('a * b -> b * a * 1 -> b * 1 * a', () => {
      const result = checkStep('a * b', 'b * 1 * a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'commutative property',
        'multiplication with identity',
      ]);

      expect(result).toHaveStepsLike([
        ['a * b', 'b * a'],
        ['b * a', 'b * 1 * a'],
      ]);
    });

    it('a * b -> a * 1 * b * 1', () => {
      const result = checkStep('a * b', 'a * 1 * b * 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication with identity']);
    });

    it('ab -> 2ab', () => {
      const mistakes = checkMistake('ab', '2ab');

      expect(mistakes).toHaveLength(1);

      expect(mistakes[0].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
      expect(mistakes[0].prevNodes).toHaveLength(0);
      expect(mistakes[0].nextNodes).toHaveLength(1);
      expect(mistakes[0].nextNodes[0]).toParseLike('2');
    });

    it('2ab -> ab', () => {
      const mistakes = checkMistake('2ab', 'ab');

      expect(mistakes).toHaveLength(1);

      expect(mistakes[0].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
      expect(mistakes[0].prevNodes).toHaveLength(1);
      expect(mistakes[0].prevNodes[0]).toParseLike('2');
      expect(mistakes[0].nextNodes).toHaveLength(0);
    });

    it('1 + ab -> 1 + 2ab', () => {
      const mistakes = checkMistake('1 + ab', '1 + 2ab');

      expect(mistakes).toHaveLength(1);

      expect(mistakes[0].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
      expect(mistakes[0].prevNodes).toHaveLength(0);
      expect(mistakes[0].nextNodes).toHaveLength(1);
      expect(mistakes[0].nextNodes[0]).toParseLike('2');
    });
  });

  describe('checkDistribution', () => {
    it('a * (b + c) -> a * b + a * c', () => {
      const result = checkStep('a * (b + c)', 'a * b + a * c');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('(b + c) * a -> b * a + c * a', () => {
      const result = checkStep('(b + c) * a', 'b * a + c * a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('a * (b + c) -> a * b + c [incorrect]', () => {
      expect(() => checkStep('a * (b + c)', 'a * b + c')).toThrow();
    });

    it('2(x + y) -> 2x + 2y', () => {
      const result = checkStep('2(x + y)', '2x + 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('-2(x + y) -> -2x - 2y', () => {
      const result = checkStep('-2(x + y)', '-2x - 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'move negation inside multiplication',
        'distribution',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);

      expect(result).toHaveStepsLike([
        ['-2(x + y)', '(-2)(x + y)'],
        ['(-2)(x + y)', '(-2)(x) + (-2)(y)'],
        ['(-2)(x) + (-2)(y)', '-2x + -2y'],
        ['-2x + -2y', '-2x - 2y'],
      ]);
    });

    it('1 + 2(x + y) -> 1 + 2x + 2y', () => {
      const result = checkStep('1 + 2(x + y)', '1 + 2x + 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('2(x + y) + 3(a + b) -> 2x + 2y + 3a + 3b', () => {
      const result = checkStep('2(x + y) + 3(a + b)', '2x + 2y + 3a + 3b');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution', 'distribution']);
    });

    it('1 - 2(x + y) -> 1 - 2x - 2y', () => {
      const result = checkStep('1 - 2(x + y)', '1 - 2x - 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'move negation inside multiplication',
        'distribution',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('1 - 2(x + y) -> 1 + -2(x + y)', () => {
      const result = checkStep('1 - 2(x + y)', '1 + -2(x + y)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
      ]);

      expect(result).toHaveStepsLike([['1 - 2(x + y)', '1 + -2(x + y)']]);
    });

    it('1 + (-2)(x + y) -> 1 + -2x + -2y', () => {
      const result = checkStep('1 + -2(x + y)', '1 + -2x + -2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'move negation inside multiplication',
        'distribution',
        'move negation out of multiplication',
      ]);

      expect(result).toHaveStepsLike([
        ['1 + -2(x + y)', '1 + (-2)(x + y)'],
        ['1 + (-2)(x + y)', '1 + (-2)(x) + (-2)(y)'],
        ['1 + (-2)(x) + (-2)(y)', '1 + -2x + -2y'],
      ]);
    });

    it('1 + -2(x + y) -> 1 + -2x + -2y', () => {
      const result = checkStep('1 + -2(x + y)', '1 + -2x + -2y');

      expect(result).toBeTruthy();

      expect(result).toHaveMessages([
        'move negation inside multiplication',
        'distribution',
        'move negation out of multiplication',
      ]);
    });

    it('1 - (x + y) -> 1 - x - y', () => {
      const result = checkStep('1 - (x + y)', '1 - x - y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'negation is the same as multipling by negative one',
        'distribution',
        'negation is the same as multipling by negative one',
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('2(x - y) -> 2(x + -y)', () => {
      const result = checkStep('2(x - y)', '2(x + -y)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('2(x - y) -> 2x - 2y', () => {
      const result = checkStep('2(x - y)', '2x - 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'distribution',
        'move negative to first factor',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('2x + 2(-y) -> 2x - 2y', () => {
      const result = checkStep('2x + 2(-y)', '2x - 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'move negative to first factor',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('-2(x - y) -> -2x + 2y', () => {
      const result = checkStep('-2(x - y)', '-2x + 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'move negation inside multiplication',
        'distribution',
        'multiplying two negatives is a positive',
        'move negation out of multiplication',
      ]);
    });

    it('1 - 2(x - y) -> 1 - 2x + 2y', () => {
      const result = checkStep('1 - 2(x - y)', '1 - 2x + 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'move negation inside multiplication',
        'distribution',
        'multiplying two negatives is a positive',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);
    });

    it('1 - (x - y) -> 1 - x + y', () => {
      const result = checkStep('1 - 2(x - y)', '1 - 2x + 2y');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'move negation inside multiplication',
        'distribution',
        'multiplying two negatives is a positive',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);
    });

    // TODO: improve the performance of this test
    it('1 - (x + y) - (a + b) -> 1 - x - y - a - b', () => {
      const result = checkStep('1 - (x + y) - (a + b)', '1 - x - y - a - b');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
        'negation is the same as multipling by negative one',
        'distribution',
        'distribution',
        'negation is the same as multipling by negative one',
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
        'subtracting is the same as adding the inverse',
      ]);

      // TODO: use implicit multiplication in more places
      expect(result.steps[0].before).toParseLike('1 - (x + y) - (a + b)');
      expect(result.steps[0].after).toParseLike('1 + -(x + y) - (a + b)');

      expect(result.steps[1].before).toParseLike('1 + -(x + y) - (a + b)');
      expect(result.steps[1].after).toParseLike('1 + -(x + y) + -(a + b)');

      expect(result.steps[2].before).toParseLike('1 + -(x + y) + -(a + b)');
      expect(result.steps[2].after).toParseLike(
        '1 + (-1)(x + y) + (-1)(a + b)',
      );

      expect(result.steps[3].before).toParseLike(
        '1 + (-1)(x + y) + (-1)(a + b)',
      );
      expect(result.steps[3].after).toParseLike(
        '1 + (-1)(x) + (-1)(y) + (-1)(a + b)',
      );

      expect(result.steps[4].before).toParseLike(
        '1 + (-1)(x) + (-1)(y) + (-1)(a + b)',
      );
      expect(result.steps[4].after).toParseLike(
        '1 + (-1)(x) + (-1)(y) + (-1)(a) + (-1)(b)',
      );

      // TODO: finish writing this test
    });

    it('2 * a * (b + c) -> 2 * a * b + 2 * a * c', () => {
      const result = checkStep('(2)(a)(b + c)', '2ab + 2ac');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('(x)(a + b)(y) -> xay + xby', () => {
      const result = checkStep('(x)(a + b)(y)', 'xay + xby');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('(a + b) * (x + y) -> (a + b) * x + (a + b) * y', () => {
      const result = checkStep(
        '(a + b) * (x + y)',
        '(a + b) * x + (a + b) * y',
      );

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('(a + b) * (x + y) -> a * (x + y) + b * (x + y)', () => {
      const result = checkStep(
        '(a + b) * (x + y)',
        'a * (x + y) + b * (x + y)',
      );

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['distribution']);
    });

    it('a * (x + y) + b * (x + y) -> ax + ay + b * (x + y)', () => {
      const result = checkStep(
        'a * (x + y) + b * (x + y)',
        'ax + ay + b * (x + y)',
      );

      expect(result).toBeTruthy();
      // TODO: make distribution parallel and pick the shortest path
      expect(result).toHaveMessages(['distribution']);
    });

    it('(a + b) * (x + y) -> ax + ay + bx + by', () => {
      const result = checkStep('(a + b) * (x + y)', 'ax + ay + bx + by');

      expect(result.steps[0].before).toMatchInlineSnapshot(`
                (mul.exp
                  (Add a b)
                  (Add x y))
            `);

      expect(result.steps[0].after).toMatchInlineSnapshot(`
                (Add
                  (mul.exp
                    a
                    (Add x y))
                  (mul.exp
                    b
                    (Add x y)))
            `);

      expect(result.steps[1].before).toMatchInlineSnapshot(`
                (Add
                  (mul.exp
                    a
                    (Add x y))
                  (mul.exp
                    b
                    (Add x y)))
            `);

      expect(result.steps[1].after).toMatchInlineSnapshot(`
                (Add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp
                    b
                    (Add x y)))
            `);

      expect(result.steps[2].before).toMatchInlineSnapshot(`
                (Add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp
                    b
                    (Add x y)))
            `);

      expect(result.steps[2].after).toMatchInlineSnapshot(`
                (Add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp b x)
                  (mul.exp b y))
            `);

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'distribution',
        'distribution',
        'distribution',
      ]);
    });

    it('(x + 1)(x + 1) -> x*x + x*1 + 1*x + 1*1', () => {
      const result = checkStep('(x + 1)(x + 1)', 'xx + 1x + (x)(1) + (1)(1)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'distribution',
        'distribution',
        'distribution',
      ]);

      expect(result).toHaveStepsLike([
        ['(x + 1)(x + 1)', '(x + 1)x + (x + 1)(1)'],
        ['(x + 1)x + (x + 1)(1)', 'xx + 1x + (x + 1)(1)'],
        ['xx + 1x + (x + 1)(1)', 'xx + 1x + (x)(1) + (1)(1)'],
      ]);
    });

    it('(x + 1)(x + 1) -> x^2 + 2x + 1', () => {
      const result = checkStep('(x + 1)(x + 1)', 'x^2 + x + x + 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'distribution',
        'distribution',
        'distribution',
        'multiplying a factor n-times is an exponent', // x*x -> x^2
        'multiplication with identity',
        'multiplication with identity',
        'multiplication with identity',
      ]);
    });

    it('1 + (x + 1)(x + 1) -> 1 + x^2 + 2x + 1', () => {
      const result = checkStep('1 + (x + 1)(x + 1)', '1 + x^2 + x + x + 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'distribution',
        'distribution',
        'distribution',
        'multiplying a factor n-times is an exponent', // x*x -> x^2
        'multiplication with identity',
        'multiplication with identity',
        'multiplication with identity',
      ]);
    });

    it('(x + 1)^2 -> x^2 + 2x + 1', () => {
      const result = checkStep('(x + 1)^2', 'x^2 + 2x + 1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'a power is the same as multiplying the base n times',
        'distribution',
        'distribution',
        'distribution',
        'collect like terms',
        'multiplying a factor n-times is an exponent',
        'evaluation of addition',
        'multiplication with identity',
      ]);
    });
  });

  describe('checkFactoring', () => {
    it('a * b + a * c -> a * (b + c)', () => {
      const result = checkStep('a * b + a * c', 'a * (b + c)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['factoring']);
    });

    it('ab + a -> a(b + 1)', () => {
      const result = checkStep('ab + a', 'a(b + 1)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'multiplication with identity', // a -> (a)(1)
        'factoring',
      ]);
    });

    it('a - ab -> (a)(1) + (-a)(b)', () => {
      const result = checkStep('a - ab', '(a)(1) + (-a)(b)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'multiplication with identity',
        'move negation inside multiplication',
      ]);
    });

    it('a - ab -> a(1 - b)', () => {
      const result = checkStep('a - ab', 'a(1 - b)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'move negation inside multiplication',
        'multiplication with identity',
        'move negative to first factor',
        'factoring',
      ]);
    });

    it('-a - ab -> -a(1 + b)', () => {
      const result = checkStep('-a - ab', '-a(1 + b)');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'move negation inside multiplication',
        'multiplication with identity',
        'factoring',
        'move negation out of multiplication',
      ]);

      expect(result).toHaveStepsLike([
        ['-a - ab', '-a + -(ab)'],
        ['-a + -(ab)', '-a + (-a)(b)'],
        ['-a', '(-a)(1)'],
        ['(-a)(1) + (-a)(b)', '(-a)(1 + b)'],
        ['(-a)(1 + b)', '-a(1 + b)'],
      ]);
    });

    it('-a(1 + b) -> -a - ab', () => {
      const result = checkStep('-a(1 + b)', '-a - ab');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'move negation inside multiplication',
        'distribution',
        'multiplication with identity',
        'move negation out of multiplication',
        'subtracting is the same as adding the inverse',
      ]);

      expect(result).toHaveStepsLike([
        ['-a(1 + b)', '(-a)(1 + b)'],
        ['(-a)(1 + b)', '(-a)(1) + (-a)(b)'],
        ['(-a)(1)', '-a'],
        ['-a + (-a)(b)', '-a + -(ab)'],
        ['-a + -(ab)', '-a - ab'],
      ]);
    });

    it('2x + 3x -> (2 + 3)x', () => {
      const result = checkStep('2x + 3x', '(2 + 3)x');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['factoring']);
    });

    it('(2 + 3)x -> 5x', () => {
      const result = checkStep('(2 + 3)x', '5x');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['evaluation of addition']);
    });
  });

  describe('mulByZero', () => {
    it('0 -> 0 * a', () => {
      const result = checkStep('0', '0 * a');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication by zero']);
    });

    it('a * 0 * b -> 0', () => {
      const result = checkStep('a * 0 * b', '0');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages(['multiplication by zero']);
    });

    it('1 + 0a + 0b -> 1', () => {
      const result = checkStep('1 + 0a + 0b', '1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'multiplication by zero',
        'multiplication by zero',
        'addition with identity',
      ]);
    });

    it('1 + (a - a)b -> 1', () => {
      const result = checkStep('1 + (a - a)b', '1');

      expect(result).toBeTruthy();
      expect(result).toHaveMessages([
        'subtracting is the same as adding the inverse',
        'adding inverse',
        'multiplication by zero',
        'addition with identity',
      ]);
    });
  });

  describe('associativeMul', () => {
    it('a(bc) -> (ab)c', () => {
      const result = checkStep('a(bc)', '(ab)c');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
        'associative property of multiplication',
      ]);
    });

    it('abcd -> (ab)(cd)', () => {
      const result = checkStep('abcd', '(ab)(cd)');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
      ]);
    });

    it('(ab)(cd) -> abcd', () => {
      const result = checkStep('(ab)(cd)', 'abcd');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
      ]);
    });

    it('a(cd) -> abcd', () => {
      const result = checkStep('a(cd)', 'acd');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
      ]);
    });

    it('(a)(b)(cd) -> abcd', () => {
      const result = checkStep('(a)(b)(cd)', 'abcd');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
      ]);
    });

    it('a(b(cd)) -> abcd', () => {
      const result = checkStep('a(b(cd))', 'abcd');

      expect(result).toBeTruthy();
      expect(result.steps.map((reason) => reason.message)).toEqual([
        'associative property of multiplication',
        'associative property of multiplication',
      ]);
    });
  });

  describe('associativeAdd', () => {
    it('a + (b + c) -> (a + b) + c', () => {
      const result = checkStep('a + (b + c)', '(a + b) + c');

      expect(result).toBeTruthy();
      expect(result.steps.map((step) => step.message)).toEqual([
        'associative property of addition',
        'associative property of addition',
      ]);
    });

    it('(a + b) + (c + d) -> a + b + c + d', () => {
      const result = checkStep('(a + b) + (c + d)', 'a + b + c + d');

      expect(result).toBeTruthy();
      expect(result.steps.map((step) => step.message)).toEqual([
        'associative property of addition',
      ]);
    });

    it('a + b + c + d -> (a + b) + (c + d)', () => {
      const result = checkStep('a + b + c + d', '(a + b) + (c + d)');

      expect(result).toBeTruthy();
      expect(result.steps.map((step) => step.message)).toEqual([
        'associative property of addition',
      ]);
    });

    it('a + b + (c + d) -> a + b + c + d', () => {
      const result = checkStep('a + b + (c + d)', 'a + b + c + d');

      expect(result).toBeTruthy();
      expect(result.steps.map((step) => step.message)).toEqual([
        'associative property of addition',
      ]);
    });

    it('a + (b + (c + d)) -> a + b + c + d', () => {
      const result = checkStep('a + (b + (c + d))', 'a + b + c + d');

      expect(result).toBeTruthy();
      expect(result.steps.map((step) => step.message)).toEqual([
        'associative property of addition',
        'associative property of addition',
      ]);
    });
  });
});
