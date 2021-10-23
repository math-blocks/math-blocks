import { range, zip } from '../util';

describe('range', () => {
  it('should not include the last end number', () => {
    const result = [...range(0, 5)];
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });

  it('should work with non-zero start', () => {
    const result = [...range(3, 5)];
    expect(result).toEqual([3, 4]);
  });

  it('should return an empty iterator when start >= end', () => {
    const result = [...range(5, 5)];
    expect(result).toEqual([]);
  });
});

describe('zip', () => {
  it('should an array the length of the shortest array', () => {
    expect(zip([1, 2], ['a', 'b', 'c'])).toHaveLength(2);
    expect(zip([1, 2, 3], ['a', 'b'])).toHaveLength(2);
  });

  it('should return an array of zipped values', () => {
    expect(zip([1, 2], ['a', 'b'])).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });
});
