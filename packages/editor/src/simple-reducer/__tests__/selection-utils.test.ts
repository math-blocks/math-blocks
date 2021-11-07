import * as SelectionUtils from '../selection-utils';

describe('SelectionUtils.isCollapsed', () => {
  it('should return true if the anchor and focus are at the same location', () => {
    const selection = SelectionUtils.makeSelection2([0, 1], 2, [0, 1], 2);

    const result = SelectionUtils.isCollapsed(selection);

    expect(result).toBe(true);
  });

  it('should return false if the paths are the same, but the offsets are different', () => {
    const selection = SelectionUtils.makeSelection2([0, 1], 2, [0, 1], 4);

    const result = SelectionUtils.isCollapsed(selection);

    expect(result).toBe(false);
  });

  it('should return false if the paths are different', () => {
    const selection = SelectionUtils.makeSelection2([0, 1], 4, [0, 2], 4);

    const result = SelectionUtils.isCollapsed(selection);

    expect(result).toBe(false);
  });
});

describe('getPathAndRange', () => {
  test('selections with the same path', () => {
    const selection = SelectionUtils.makeSelection2([0, 1], 2, [0, 1], 4);

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [0, 1],
      start: 2,
      end: 4,
    });
  });

  test('numerator and denominator in the same fraction', () => {
    const selection = SelectionUtils.makeSelection2([4, 0], 0, [4, 1], 0);

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [],
      start: 4,
      end: 5,
    });
  });

  test('numerator and denominator in different fractions', () => {
    const selection = SelectionUtils.makeSelection2([2, 0], 0, [4, 1], 0);

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [],
      start: 2,
      end: 5,
    });
  });

  test('numerator and denominator in different fractions (reverse)', () => {
    const selection = SelectionUtils.makeSelection2([4, 1], 0, [2, 0], 0);

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [],
      start: 2,
      end: 5,
    });
  });

  test('spanning multiple levels in hierarchy', () => {
    const selection = SelectionUtils.makeSelection2([2, 0, 1, 0], 0, [2, 1], 0);

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [],
      start: 2, // same as the first element in both paths
      end: 3,
    });
  });

  test('same numerator and denominator in nested fraction', () => {
    const selection = SelectionUtils.makeSelection2(
      [2, 0, 1, 0],
      0,
      [2, 0, 1, 1],
      0,
    );

    const result = SelectionUtils.getPathAndRange(selection);

    expect(result).toEqual({
      path: [2, 0],
      start: 1, // smae as the thir element in each path
      end: 2,
    });
  });
});
