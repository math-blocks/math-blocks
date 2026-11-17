import { getId, UnreachableCaseError, notEmpty, clone } from '../index';

describe('core', () => {
  describe('getId', () => {
    test('returns a new, increasing id on each call', () => {
      const first = getId();
      const second = getId();
      const third = getId();

      expect(second).toBe(first + 1);
      expect(third).toBe(second + 1);
    });

    test('never returns the same id twice', () => {
      const ids = new Set(Array.from({ length: 100 }, () => getId()));

      expect(ids.size).toBe(100);
    });
  });

  describe('UnreachableCaseError', () => {
    test('includes the unexpected value in its message', () => {
      const error = new UnreachableCaseError('foo' as never);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unreachable case: foo');
    });

    test('can be used in the default case of an exhaustive switch', () => {
      type Shape = 'circle' | 'square';
      const area = (shape: Shape): number => {
        switch (shape) {
          case 'circle':
            return Math.PI;
          case 'square':
            return 1;
          default:
            throw new UnreachableCaseError(shape);
        }
      };

      expect(area('square')).toBe(1);
      expect(() => area('triangle' as Shape)).toThrow(
        'Unreachable case: triangle',
      );
    });
  });

  describe('notEmpty', () => {
    test('returns false for null and undefined', () => {
      expect(notEmpty(null)).toBe(false);
      expect(notEmpty(undefined)).toBe(false);
    });

    test('returns true for falsy values that are not null or undefined', () => {
      expect(notEmpty(0)).toBe(true);
      expect(notEmpty('')).toBe(true);
      expect(notEmpty(false)).toBe(true);
      expect(notEmpty(NaN)).toBe(true);
    });

    test('returns true for objects', () => {
      expect(notEmpty({})).toBe(true);
      expect(notEmpty([])).toBe(true);
    });

    test('filters null and undefined out of an array', () => {
      const values: (number | null | undefined)[] = [1, null, 0, undefined, 2];

      const result: number[] = values.filter(notEmpty);

      expect(result).toEqual([1, 0, 2]);
    });
  });

  describe('clone', () => {
    test('returns a deep copy that is equal to the original', () => {
      const original = { a: 1, b: { c: [1, 2, { d: 'e' }] } };

      const copy = clone(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.b).not.toBe(original.b);
      expect(copy.b.c).not.toBe(original.b.c);
    });

    test('changes to the copy do not affect the original', () => {
      const original = { list: [1, 2, 3], nested: { value: 'x' } };

      const copy = clone(original);
      copy.list.push(4);
      copy.nested.value = 'y';

      expect(original).toEqual({ list: [1, 2, 3], nested: { value: 'x' } });
    });

    test('drops values that JSON cannot represent', () => {
      const original = { a: 1, b: undefined, c: () => 5 };

      expect(clone(original)).toEqual({ a: 1 });
    });
  });
});
