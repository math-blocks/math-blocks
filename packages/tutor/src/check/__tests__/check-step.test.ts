import * as Testing from '../../testing';

import { checkStep } from '../check-step';
import type { CheckStepResult } from '../check-step';

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
  });

  describe('relations with a coefficient of -1', () => {
    it('flips the inequality when dividing by -1', () => {
      expect(statusOf('-x > 2', 'x < -2')).toBe('equivalent');
      expect(statusOf('x < -2', '-x > 2')).toBe('equivalent');
      expect(statusOf('-x > 2', 'x > -2')).toBe('not-equivalent');
      expect(statusOf('-x ≥ 2', 'x ≤ -2')).toBe('equivalent');
      expect(statusOf('x ≤ -2', '-x ≥ 2')).toBe('equivalent');
      expect(statusOf('-x ≤ 2', 'x ≥ -2')).toBe('equivalent');
      expect(statusOf('-x ≥ 2', 'x ≥ -2')).toBe('not-equivalent');
      expect(statusOf('-x ≥ 2', 'x < -2')).toBe('not-equivalent');
    });

    it('solves equations whose variable term ends up as -x', () => {
      expect(statusOf('-x = 3', 'x = -3')).toBe('equivalent');
      expect(statusOf('4b + 5 = 1 + 5b', 'b = 4')).toBe('equivalent');
      expect(statusOf('4b + 5 = 1 + 5b', '-b = -4')).toBe('equivalent');
      expect(statusOf('4b + 5 = 1 + 5b', 'b = -4')).toBe('not-equivalent');
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
