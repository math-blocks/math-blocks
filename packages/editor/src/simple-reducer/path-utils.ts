import type { CharNode } from '../char/types';
import type { Path } from './types';

export const equals = (path1: Path, path2: Path): boolean => {
  if (path1.length !== path2.length) {
    return false;
  }
  return path1.every((value, index) => value === path2[index]);
};

export const isPrefix = (prefixPath: Path, otherPath: Path): boolean => {
  if (prefixPath.length >= otherPath.length) {
    return false;
  }

  return prefixPath.every((value, index) => value === otherPath[index]);
};

export const getNodeAtPath = (root: CharNode, path: Path): CharNode | null => {
  if (path.length === 0) {
    return root;
  }

  if ('children' in root) {
    const [first, ...rest] = path;
    const child = root.children[first];
    if (child) {
      return getNodeAtPath(child, rest);
    }
  }

  return null;
};
