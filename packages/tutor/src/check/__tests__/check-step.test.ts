import * as Testing from '../../testing';

import { checkStep } from '../check-step';
import type { AnswerComparison, CheckStepResult } from '../check-step';

const check = (prev: string, next: string): CheckStepResult =>
  checkStep(Testing.parse(prev), Testing.parse(next));

const statusOf = (prev: string, next: string): CheckStepResult['status'] =>
  check(prev, next).status;

describe('checkStep', () => {
  describe('expressions', () => {
    test.each([
      ['2x + 3x', '5x'],
      ['2 + 3', '5'],
      ['1/2 + 1/3', '5/6'],
      ['2(x + 3)', '2x + 6'],
      ['2x + 1', '2x * 1 + 1'],
      ['(x + 1)(x + 2)', 'x^2 + 3x + 2'],
      ['(x + 1)^2', 'x^2 + 2x + 1'],
      ['(x - 3)^2', 'x^2 - 6x + 9'],
    ])('%s -> %s is equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('equivalent');
    });

    test.each([
      ['x + 2', '2 + x'],
      ['2(x + 3)', '6 + 2x'],
      ['2xy', 'y * 2 * x'],
      ['x^2 + x^2', '2x^2'],
    ])('%s -> %s is equivalent regardless of order', (prev, next) => {
      expect(statusOf(prev, next)).toBe('equivalent');
    });

    test.each([
      ['x - 2', '-2 + x'],
      ['3 - x', '-x + 3'],
      ['x - y - 2', '-2 - y + x'],
      ['x - (2 - y)', 'x - 2 + y'],
    ])('%s -> %s is equivalent with subtraction reordered', (prev, next) => {
      expect(statusOf(prev, next)).toBe('equivalent');
    });

    test.each([
      ['x - 2', '2 - x'],
      ['x - y', 'y - x'],
    ])('%s -> %s is not equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('not-equivalent');
    });

    test.each([
      ['2x + 3x', '6x'],
      ['2 + 3', '6'],
      ['2(x + 3)', '2x + 3'],
      ['(x + 1)^2', 'x^2 + 1'],
    ])('%s -> %s is not equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('not-equivalent');
    });

    it('returns the simplified answer', () => {
      const result = check('2x + 3x', '5x');
      expect(result.status).toBe('equivalent');
      if (result.status === 'equivalent') {
        expect(Testing.print(result.answer)).toBe('5x');
      }
    });

    it('returns both answers when they differ', () => {
      const result = check('2x + 3x', '6x');
      expect(result.status).toBe('not-equivalent');
      if (result.status === 'not-equivalent') {
        expect(Testing.print(result.prevAnswer)).toBe('5x');
        expect(Testing.print(result.nextAnswer)).toBe('6x');
      }
    });
  });

  describe('linear equations', () => {
    test.each([
      ['2x + 5 = 10', '2x = 5'],
      ['2x + 5 = 10', 'x = 5/2'],
      ['2x + 5 = 10', '5 = 10 - 2x'],
      ['2x = 6', '3 = x'],
      ['x / 2 = 3', 'x = 6'],
    ])('%s -> %s is equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('equivalent');
    });

    test.each([
      ['2x + 5 = 10', '2x = 15'],
      ['2x + 5 = 10', 'x = 5'],
    ])('%s -> %s is not equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('not-equivalent');
    });

    it('treats two identities as equivalent', () => {
      expect(statusOf('x + 1 = x + 1', '1 = 1')).toBe('equivalent');
    });

    it('treats two contradictions as equivalent', () => {
      expect(statusOf('x + 1 = x + 2', '1 = 2')).toBe('equivalent');
    });

    it("doesn't treat an identity and a contradiction as equivalent", () => {
      expect(statusOf('x + 1 = x + 1', '1 = 2')).toBe('not-equivalent');
    });
  });

  describe('linear inequalities', () => {
    it('handles inequalities', () => {
      expect(statusOf('x + 1 > 3', 'x > 2')).toBe('equivalent');
      expect(statusOf('x + 1 > 3', 'x > 3')).toBe('not-equivalent');
    });

    it('treats flipped inequalities as equivalent', () => {
      expect(statusOf('x < 3', '3 > x')).toBe('equivalent');
    });

    it('compares inequalities that are always true or always false', () => {
      expect(statusOf('x + 1 > x', '1 > 0')).toBe('equivalent');
      expect(statusOf('x + 1 < x', '1 < 0')).toBe('equivalent');
      expect(statusOf('x + 1 > x', '1 < 0')).toBe('not-equivalent');
    });

    it('compares non-strict inequalities that are always true or false', () => {
      expect(statusOf('x + 1 ≥ x', '1 ≥ 0')).toBe('equivalent');
      expect(statusOf('x + 1 ≤ x', '1 ≤ 0')).toBe('equivalent');
      expect(statusOf('x + 1 ≥ x', '1 ≤ 0')).toBe('not-equivalent');
    });

    it('handles non-strict inequalities', () => {
      expect(statusOf('2x + 1 ≤ 7', 'x ≤ 3')).toBe('equivalent');
      expect(statusOf('2x + 1 ≥ 7', '3 ≤ x')).toBe('equivalent');
    });
  });

  describe('quadratic equations', () => {
    test.each([
      ['x^2 + 5x + 6 = 0', '(x + 2)(x + 3) = 0'],
      ['x^2 + 5x + 6 = 0', 'x^2 + 5x = -6'],
      ['(x + 1)^2 = 4', 'x^2 + 2x - 3 = 0'],
    ])('%s -> %s is equivalent', (prev, next) => {
      expect(statusOf(prev, next)).toBe('equivalent');
    });

    it('expands a product before checking the degree', () => {
      expect(statusOf('x(x + 1) = 6', 'x^2 + x = 6')).toBe('equivalent');
    });

    it('handles x * x as a square', () => {
      expect(statusOf('x * x + 5x + 6 = 0', '(x + 2)(x + 3) = 0')).toBe(
        'equivalent',
      );
    });

    it('detects a sign error', () => {
      expect(statusOf('x^2 + 5x + 6 = 0', 'x^2 + 5x = 6')).toBe(
        'not-equivalent',
      );
    });
  });

  describe('mixed steps', () => {
    it("doesn't treat an equation and an expression as equivalent", () => {
      expect(statusOf('2x + 5 = 10', '2x + 5')).toBe('not-equivalent');
    });
  });

  describe("steps the solver can't handle", () => {
    it('returns unknown for relations with more than one variable', () => {
      const result = check('x + y = 5', 'x = 5 - y');
      expect(result).toEqual({
        status: 'unknown',
        reason: 'relations must contain exactly one variable',
      });
    });

    it('returns unknown when the variable changes', () => {
      expect(statusOf('x + 1 = 3', 'y + 1 = 3')).toBe('unknown');
    });

    it('returns unknown for cubic equations', () => {
      expect(statusOf('x^3 = 8', 'x = 2')).toBe('unknown');
    });

    it('returns unknown when the variable is in an exponent or denominator', () => {
      expect(statusOf('2^x = 8', 'x = 3')).toBe('unknown');
      expect(statusOf('1/x + 1 = 2', 'x = 1')).toBe('unknown');
    });

    it('returns unknown for quadratic inequalities', () => {
      expect(statusOf('x^2 > 4', 'x^2 - 4 > 0')).toBe('unknown');
    });

    it("returns unknown when the solver can't isolate the variable", () => {
      // The linear solver doesn't divide inequalities by negative numbers yet.
      expect(statusOf('-x > 2', 'x < -2')).toBe('unknown');
      expect(statusOf('x < -2', '-x > 2')).toBe('unknown');
    });
  });

  describe('comparing answers', () => {
    const statusWith = (
      prev: string,
      next: string,
      answers: AnswerComparison,
    ): CheckStepResult['status'] =>
      checkStep(Testing.parse(prev), Testing.parse(next), { answers }).status;

    // The cases from #728: valid steps whose answers aren't written the way
    // the solver writes them.
    const unsimplified = [
      ['x + 3 = 5', 'x = 4/2'],
      ['2x + 5 = 10', 'x = 2.5'],
      ['2x = 5', 'x = 5 * 1/2'],
    ];

    test.each(unsimplified)(
      "%s -> %s is equivalent with answers: 'value'",
      (prev, next) => {
        expect(statusWith(prev, next, 'value')).toBe('equivalent');
      },
    );

    test.each(unsimplified)(
      '%s -> %s is equivalent by default',
      (prev, next) => {
        expect(statusOf(prev, next)).toBe('equivalent');
      },
    );

    test.each(unsimplified)(
      "%s -> %s is not equivalent with answers: 'form'",
      (prev, next) => {
        expect(statusWith(prev, next, 'form')).toBe('not-equivalent');
      },
    );

    describe("answers: 'value'", () => {
      test.each([
        // Fractions
        ['x + 1 = 3', 'x = 6/3'],
        ['2x = 1', 'x = 2/4'],
        ['2x = -1', 'x = -2/4'],
        // Decimals
        ['x + 1 = 3', 'x = 2.0'],
        ['4x = 1', 'x = 0.25'],
        ['x = 0.1 + 0.2', 'x = 0.3'],
        ['2x = 1', 'x = 0.5'],
        // The variable on either side
        ['2x + 5 = 10', '2.5 = x'],
        ['2x + 5 = 10', '5/2 = x'],
        ['x + 3 = 5', '4/2 = x'],
        ['2.5 = x', 'x = 5/2'],
        // Inequalities
        ['2x + 1 > 6', 'x > 2.5'],
        ['2x + 1 > 6', '2.5 < x'],
        ['2x + 1 ≤ 6', 'x ≤ 10/4'],
        ['2x + 1 ≥ 6', '5/2 ≤ x'],
        // Expressions
        ['1/2 + 1/3', '5/6'],
        ['1/2 + 1/4', '0.75'],
        ['5/2', '2.5'],
      ])('%s -> %s is equivalent', (prev, next) => {
        expect(statusWith(prev, next, 'value')).toBe('equivalent');
      });

      test.each([
        ['x + 3 = 5', 'x = 6/2'],
        ['2x + 5 = 10', 'x = 2.4'],
        ['2x + 5 = 10', '2.4 = x'],
        ['x = 0.1 + 0.2', 'x = 0.30001'],
        // The value matches, but the relation doesn't.
        ['2x + 1 > 6', 'x ≥ 2.5'],
        ['2x + 1 > 6', 'x < 2.5'],
        ['2x + 1 > 6', '2.5 > x'],
        ['2x + 5 = 10', 'x > 2.5'],
        // Expressions
        ['1/2 + 1/4', '0.7'],
      ])('%s -> %s is not equivalent', (prev, next) => {
        expect(statusWith(prev, next, 'value')).toBe('not-equivalent');
      });

      it('compares the solutions of a quadratic in any order', () => {
        expect(
          statusWith('x^2 + 5x + 6 = 0', '(x + 2)(x + 3) = 0', 'value'),
        ).toBe('equivalent');
        expect(statusWith('x^2 - 5x + 6 = 0', 'x^2 = 5x - 6', 'value')).toBe(
          'equivalent',
        );
      });

      it('falls back to comparing by form when an answer is not numeric', () => {
        expect(statusWith('2x + 3x', '5x', 'value')).toBe('equivalent');
        expect(statusWith('2x + 3x', '6x', 'value')).toBe('not-equivalent');
        expect(statusWith('x - 2', '2 - x', 'value')).toBe('not-equivalent');
        expect(statusWith('x + 1 = x + 1', '1 = 1', 'value')).toBe(
          'equivalent',
        );
        expect(statusWith('x + 1 = x + 1', '1 = 2', 'value')).toBe(
          'not-equivalent',
        );
      });

      it("doesn't match an equation with an expression of the same value", () => {
        expect(statusWith('x + 3 = 5', '2', 'value')).toBe('not-equivalent');
      });

      it('still returns unknown when the variable changes', () => {
        expect(statusWith('x + 3 = 5', 'y = 2', 'value')).toBe('unknown');
      });

      it("returns the solver's answer", () => {
        const result = checkStep(
          Testing.parse('2x + 5 = 10'),
          Testing.parse('x = 2.5'),
          { answers: 'value' },
        );
        expect(result.status).toBe('equivalent');
        if (result.status === 'equivalent') {
          expect(Testing.print(result.answer)).toBe('x = 5 / 2');
        }
      });
    });

    describe("answers: 'form'", () => {
      test.each([
        ['x + 1 = 3', 'x = 2.0'],
        ['2x + 5 = 10', '2.5 = x'],
        ['2x + 1 > 6', 'x > 2.5'],
        ['1/2 + 1/4', '0.75'],
      ])('%s -> %s is not equivalent', (prev, next) => {
        expect(statusWith(prev, next, 'form')).toBe('not-equivalent');
      });

      test.each([
        ['2x + 5 = 10', 'x = 5/2'],
        ['2x + 5 = 10', '5/2 = x'],
        ['x + 1 > 3', '2 < x'],
      ])('%s -> %s is still equivalent', (prev, next) => {
        expect(statusWith(prev, next, 'form')).toBe('equivalent');
      });
    });
  });

  it("doesn't modify its arguments", () => {
    const prev = Testing.parse('x^2 + 5x + 6 = 0');
    const next = Testing.parse('x^2 + 5x = -6');
    const prevCopy = JSON.stringify(prev);
    const nextCopy = JSON.stringify(next);

    checkStep(prev, next);

    expect(JSON.stringify(prev)).toBe(prevCopy);
    expect(JSON.stringify(next)).toBe(nextCopy);
  });
});
