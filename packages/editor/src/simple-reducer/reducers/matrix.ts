import * as t from '../../char/types';
import * as b from '../../char/builders';
import { NodeType } from '../../shared-types';

import * as PathUtils from '../path-utils';

import type { State, Path, Action } from '../types';

const nodesForPath = (root: t.CharRow, path: Path): t.CharNode[] => {
  let node: t.CharNode = root;
  const result: t.CharNode[] = [];
  for (const index of path) {
    if ('children' in node) {
      const nextNode: t.CharNode | null = node.children[index];
      if (!nextNode) {
        throw new Error('invalid path for root');
      }
      node = nextNode;
      result.push(node);
    } else {
      throw new Error('invalid path for root');
    }
  }
  return result;
};

const replaceElement = <T>(
  at: number,
  inArray: readonly T[],
  withElement: T,
): readonly T[] => {
  return [...inArray.slice(0, at), withElement, ...inArray.slice(at + 1)];
};

const insertElements = <T>(
  at: number,
  inArray: readonly T[],
  withElements: readonly T[],
): readonly T[] => {
  return [...inArray.slice(0, at), ...withElements, ...inArray.slice(at)];
};

const repeat = <T>(count: number, createElement: () => T): readonly T[] => {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(createElement());
  }
  return result;
};

export const matrix = (state: State, action: Action): State => {
  // TODO:
  // - check if we're inside a matrix
  // - if we are, determine which cell we're in
  // - once we have that info, add cells in the appropriate places

  if (action.type === 'InsertMatrix') {
    return state;
  }

  const { path } = state.selection.focus;
  const nodes = nodesForPath(state.row, path);
  const matrixPathIndex = nodes.findIndex(
    (node) => node.type === NodeType.Table && node.subtype === 'matrix',
  );

  if (matrixPathIndex === -1) {
    return state;
  }

  const matrix = nodes[matrixPathIndex] as t.CharTable;
  const cellPathIndex = matrixPathIndex + 1;
  const cellIndex = path[cellPathIndex];
  const rowIndex = Math.floor(cellIndex / matrix.colCount);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const colIndex = cellIndex % matrix.colCount;

  const matrixOffset = path[matrixPathIndex];
  const matrixParentPath = path.slice(0, matrixPathIndex);

  if (action.type === 'AddRow') {
    const splitIndex =
      action.side === 'above'
        ? matrix.colCount * rowIndex
        : matrix.colCount * (rowIndex + 1);

    const newRow = repeat(matrix.colCount, () => b.row([b.char('0')]));
    const newMatrix: t.CharTable = {
      ...matrix,
      children: insertElements(splitIndex, matrix.children, newRow),
      rowCount: matrix.rowCount + 1,
    };

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        return {
          ...node,
          children: replaceElement(matrixOffset, node.children, newMatrix),
        };
      },
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      path:
        action.side === 'above'
          ? replaceElement(
              cellPathIndex,
              focus.path,
              cellIndex + matrix.colCount,
            )
          : focus.path,
      offset: focus.offset,
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  if (action.type === 'DeleteRow') {
    const before = matrix.children.slice(0, matrix.colCount * rowIndex);
    const after = matrix.children.slice(matrix.colCount * (rowIndex + 1));

    const newMatrix: t.CharTable = {
      ...matrix,
      children: [...before, ...after],
      rowCount: matrix.rowCount - 1,
    };

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        return {
          ...node,
          children: replaceElement(matrixOffset, node.children, newMatrix),
        };
      },
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      path:
        rowIndex === matrix.rowCount - 1
          ? replaceElement(
              cellPathIndex,
              focus.path,
              cellIndex - matrix.colCount,
            )
          : focus.path,
      offset: focus.offset,
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  if (action.type === 'AddColumn') {
    return state;
  }

  if (action.type === 'DeleteColumn') {
    return state;
  }

  return state;
};
