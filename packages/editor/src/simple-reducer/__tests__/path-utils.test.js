import * as b from '../../char/builders';

import * as PathUtils from '../path-utils';

describe('PathUtils.isPrefix', () => {
  it('should return false if the paths are the same', () => {
    const result = PathUtils.isPrefix([1, 2, 3], [1, 2, 3]);

    expect(result).toBe(false);
  });

  it('should return true even if the second arg has extra elements', () => {
    const result = PathUtils.isPrefix([1, 2, 3], [1, 2, 3, 4, 5]);

    expect(result).toBe(true);
  });

  it('should return false if some of the elements are different', () => {
    const result = PathUtils.isPrefix([1, 2, 5], [1, 2, 3]);

    expect(result).toBe(false);
  });

  it('should return false if the prefix has more elements than the second arg', () => {
    const result = PathUtils.isPrefix([1, 2, 3, 4, 5], [1, 2, 3]);

    expect(result).toBe(false);
  });
});

describe('PathUtils.getNodeAtPath', () => {
  const row = b.row([
    b.char('x'),
    b.subsup(undefined, [b.char('2')]),
    b.char('+'),
    b.char('y'),
  ]);
  it('should return the root if the path is empty', () => {
    const result = PathUtils.getNodeAtPath(row, []);

    expect(result).toEqual(row);
  });

  it("should return null if the path isn't valid for the given root", () => {
    const result = PathUtils.getNodeAtPath(row, [7, 8]);

    expect(result).toBeNull();
  });

  it('should return the correct node for a valid path', () => {
    const result = PathUtils.getNodeAtPath(row, [1, 1]);

    const exp = row.children[1].children[1];
    expect(result).toEqual(exp);
  });
});
