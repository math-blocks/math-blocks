import * as Testing from '@math-blocks/testing';

import {
  checkStep,
  toParseLike,
  toHaveMessages,
  toHaveStepsLike,
} from '../test-util';

expect.addSnapshotSerializer(Testing.serializer);
expect.extend({ toParseLike, toHaveMessages, toHaveStepsLike });

describe('Integer checks', () => {
  it('a + -a -> 0', () => {
    const result = checkStep('a + -a', '0');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['adding inverse']);

    expect(result).toHaveStepsLike([['a + -a', '0']]);
  });

  it('1 + a + -a -> 1', () => {
    const result = checkStep('1 + a + -a', '1');

    expect(result).toHaveMessages(['adding inverse', 'addition with identity']);

    expect(result).toHaveStepsLike([
      ['1 + a + -a', '1 + 0'],
      ['1 + 0', '1'],
    ]);
  });

  it('a + 1 + -a -> 1', () => {
    const result = checkStep('a + 1 + -a', '1');

    expect(result).toHaveMessages(['adding inverse', 'addition with identity']);

    expect(result).toHaveStepsLike([
      ['a + 1 + -a', '0 + 1'],
      ['0 + 1', '1'],
    ]);
  });

  it('a + 1 + b + -a + -b -> 1', () => {
    const result = checkStep('a + 1 + b + -a + -b', '1');

    expect(result).toHaveMessages(['adding inverse', 'addition with identity']);

    expect(result.steps[0].before).toParseLike('a + 1 + b + -a + -b');
    expect(result.steps[0].after).toParseLike('0 + 1 + 0');

    expect(result.steps[1].before).toParseLike('0 + 1 + 0');
    expect(result.steps[1].after).toParseLike('1');
  });

  it('0 -> a + -a', () => {
    const result = checkStep('0', 'a + -a');

    expect(result).toBeTruthy();

    expect(result.steps[0].before).toMatchInlineSnapshot(`0`);
    expect(result.steps[0].after).toMatchInlineSnapshot(`
            (Add
              a
              (neg a))
        `);
    expect(result.steps[0].message).toEqual('adding inverse');
  });

  it('a + b + -a + c -> b + c', () => {
    const result = checkStep('a + b + -a + c', 'b + c');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['adding inverse', 'addition with identity']);
  });

  it('a - b -> a + -b', () => {
    const result = checkStep('a - b', 'a + -b');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([['a - b', 'a + -b']]);
  });

  it('a - bc -> a + -bc', () => {
    const result = checkStep('a - bc', 'a + -bc');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([['a - bc', 'a + -(bc)']]);
  });

  it('a + -b -> a - b', () => {
    const result = checkStep('a + -b', 'a - b');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);
  });

  it('a + b - c -> a + b + -c', () => {
    const result = checkStep('a + b - c', 'a + b + -c');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);
  });

  it('a - b - c -> a + -b + -c', () => {
    const result = checkStep('a - b - c', 'a + -b + -c');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([
      ['a - b - c', 'a + -b - c'],
      ['a + -b - c', 'a + -b + -c'],
    ]);
  });

  it('a - b - c -> a - b + -c', () => {
    const result = checkStep('a - b - c', 'a - b + -c');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([['a - b - c', 'a - b + -c']]);
  });

  it('a - -b -> a + --b -> a + b', () => {
    const result = checkStep('a - -b', 'a + b');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
      'negative of a negative is positive',
    ]);

    expect(result).toHaveStepsLike([
      ['a - -b', 'a + --b'],
      // We can use `applyStep` if we want the full expressions
      ['--b', 'b'],
    ]);
  });

  it('a + b -> a + --b -> a - -b', () => {
    const result = checkStep('a + b', 'a - -b');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negative of a negative is positive',
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([
      ['b', '--b'],
      ['a + --b', 'a - -b'],
    ]);
  });

  it('a - a -> 0', () => {
    const result = checkStep('a - a', '0');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
      'adding inverse',
    ]);
  });

  it('--a -> a', () => {
    const result = checkStep('--a', 'a');

    expect(result).toBeTruthy();
    expect(result.steps[0].message).toEqual(
      'negative of a negative is positive',
    );
  });

  it('a -> --a', () => {
    const result = checkStep('a', '--a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['negative of a negative is positive']);

    expect(result).toHaveStepsLike([['a', '--a']]);
  });

  it('----a -> --a', () => {
    const result = checkStep('----a', '--a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['negative of a negative is positive']);
  });

  it('--a -> ----a', () => {
    const result = checkStep('--a', '----a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['negative of a negative is positive']);

    // NOTE: This is only showing the innert most `a` since we run checks
    // on args first before fraction and integer checks
    expect(result).toHaveStepsLike([['a', '--a']]);
  });

  it('----a -> a', () => {
    const result = checkStep('----a', 'a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negative of a negative is positive',
      'negative of a negative is positive',
    ]);

    expect(result).toHaveStepsLike([
      ['----a', '--a'],
      ['--a', 'a'],
    ]);
  });

  it('a -> ----a', () => {
    const result = checkStep('a', '----a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negative of a negative is positive',
      'negative of a negative is positive',
    ]);

    expect(result).toHaveStepsLike([
      ['a', '--a'],
      ['--a', '----a'],
    ]);
  });

  it('-a -> -1 * a', () => {
    const result = checkStep('-a', '-1 * a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negation is the same as multipling by negative one',
    ]);
  });

  it('1 + -xy -> 1 - xy', () => {
    const result = checkStep('1 + -xy', '1 - xy');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'subtracting is the same as adding the inverse',
    ]);

    expect(result).toHaveStepsLike([['1 + -(xy)', '1 - xy']]);
  });

  it('(x)(y)(-z) -> -xyz', () => {
    const result = checkStep('(x)(y)(-z)', '-xyz');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'move negative to first factor',
      'move negation out of multiplication',
    ]);
  });

  it('(x)(-y)(-z) -> xyz', () => {
    const result = checkStep('(x)(-y)(-z)', 'xyz');

    expect(result).toBeTruthy();
  });

  it('xyz -> (x)(-y)(-z)', () => {
    const result = checkStep('xyz', '(x)(-y)(-z)');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'a positive is the same as multiplying two negatives',
    ]);
  });

  it('1 + (x)(-y) -> 1 - xy', () => {
    const result = checkStep('1 + (x)(-y)', '1 - xy');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'move negative to first factor',
      'move negation out of multiplication',
      'subtracting is the same as adding the inverse',
    ]);
  });

  it('-1*a -> -a', () => {
    const result = checkStep('-1 * a', '-a');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negation is the same as multipling by negative one',
    ]);
  });

  it('(-a)(-b) -> ab', () => {
    const result = checkStep('(-a)(-b)', 'ab');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages(['multiplying two negatives is a positive']);
  });

  it('ab -> (-a)(-b)', () => {
    const result = checkStep('ab', '(-a)(-b)');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'a positive is the same as multiplying two negatives',
    ]);
  });

  it('-(a + b) -> -1(a + b) -> -1a + -1b -> -a + -b', () => {
    const result = checkStep('-(a + b)', '-a + -b');

    expect(result).toBeTruthy();
    expect(result).toHaveMessages([
      'negation is the same as multipling by negative one',
      'distribution',
      'negation is the same as multipling by negative one',
    ]);

    expect(result).toHaveStepsLike([
      ['-(a + b)', '(-1)(a + b)'],
      ['(-1)(a + b)', '(-1)(a) + (-1)(b)'],
      ['(-1)(a) + (-1)(b)', '-a + -b'],
    ]);
  });

  it('-a + -b -> -(a + b)', () => {
    const result = checkStep('-a + -b', '-(a + b)');

    expect(result).toBeTruthy();

    expect(result).toHaveMessages([
      'negation is the same as multipling by negative one',
      'factoring',
      'negation is the same as multipling by negative one',
    ]);

    expect(result).toHaveStepsLike([
      ['-a + -b', '(-1)(a) + (-1)(b)'],
      ['(-1)(a) + (-1)(b)', '(-1)(a + b)'],
      ['(-1)(a + b)', '-(a + b)'],
    ]);
  });
});
