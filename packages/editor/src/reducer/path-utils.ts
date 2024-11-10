import { traverseNode } from '../char/transforms';

import type { CharNode, CharRow } from '../char/types';
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

export const getCommonPrefix = (path1: Path, path2: Path): Path => {
  if (path1.length === 0 || path2.length === 0) {
    return [];
  }
  const [head1, ...rest1] = path1;
  const [head2, ...rest2] = path2;
  if (head1 === head2) {
    return [head1, ...getCommonPrefix(rest1, rest2)];
  }
  return [];
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

export const updateRowAtPath = (
  root: CharRow,
  path: Path,
  callback: (rowToUpdate: CharRow) => CharRow | void,
): CharRow => {
  return traverseNode(
    root,
    {
      // @ts-expect-error: it's hard to convince TypeScript that this is safe
      exit: (node, currentPath) => {
        if (equals(currentPath, path) && node.type === 'row') {
          return callback(node);
        }
        return undefined;
      },
    },
    [],
  );
};
