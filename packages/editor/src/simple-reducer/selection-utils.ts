import { traverseNode } from '../char/transforms';
import { CharNode, CharRow } from '../char/types';

import * as PathUtils from './path-utils';

import type { Path, Selection } from './types';

export const updateSelection = (
  selection: Selection,
  selecting: boolean,
  newFocus: {
    readonly path: Path;
    readonly offset: number;
  },
): Selection => {
  return selecting
    ? { anchor: selection.anchor, focus: newFocus }
    : // We can reuse newFocus here because all its properties are readonly
      { anchor: newFocus, focus: newFocus };
};

export const getPathAndRange = (
  selection: Selection,
): { readonly path: Path; readonly start: number; readonly end: number } => {
  const { anchor, focus } = selection;
  const commonPrefix = PathUtils.getCommonPrefix(anchor.path, focus.path);

  if (commonPrefix.length % 2) {
    const lastIndex = commonPrefix[commonPrefix.length - 1];
    return {
      path: commonPrefix.slice(0, -1),
      start: lastIndex,
      end: lastIndex + 1,
    };
  }

  const anchorOffset =
    anchor.path.length > commonPrefix.length
      ? anchor.path[commonPrefix.length]
      : anchor.offset;

  const focusOffset =
    focus.path.length > commonPrefix.length
      ? focus.path[commonPrefix.length]
      : focus.offset;

  const start = Math.min(anchorOffset, focusOffset);
  let end = Math.max(anchorOffset, focusOffset);

  if (end === focusOffset && focus.path.length > commonPrefix.length) {
    end += 1;
  }
  if (end === anchorOffset && anchor.path.length > commonPrefix.length) {
    end += 1;
  }

  return {
    path: commonPrefix,
    start,
    end,
  };
};

export const isCollapsed = (selection: Selection): boolean => {
  return (
    PathUtils.equals(selection.anchor.path, selection.focus.path) &&
    selection.anchor.offset === selection.focus.offset
  );
};

export const makeSelection = (path: Path, offset: number): Selection => {
  return {
    anchor: { path, offset },
    focus: { path, offset },
  };
};

export const makeSelection2 = (
  anchorPath: Path,
  anchorOffset: number,
  focusPath: Path,
  focusOffset: number,
): Selection => {
  return {
    anchor: { path: anchorPath, offset: anchorOffset },
    focus: { path: focusPath, offset: focusOffset },
  };
};

const replaceElements = <T>(
  inArray: readonly T[],
  from: number,
  to: number,
  withElement: T,
): readonly T[] => {
  return [...inArray.slice(0, from), withElement, ...inArray.slice(to + 1)];
};

export const replaceSelection = (
  root: CharRow,
  selection: Selection,
  callback: () => CharNode,
): CharRow => {
  const { start, end, path } = getPathAndRange(selection);

  return traverseNode(
    root,
    {
      exit: (node, currentPath) => {
        if (PathUtils.equals(currentPath, path) && node.type === 'row') {
          const newNode = callback();

          return {
            ...node,
            children: replaceElements(node.children, start, end, newNode),
          };
        }
        return undefined;
      },
    },
    [],
  );
};
