import type { Mutable } from 'utility-types';

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

type Cell = {
  readonly row: number;
  readonly col: number;
  readonly content: t.CharRow | null;
};

const getCellsFromTable = (table: t.CharTable): Cell[] => {
  const cells: Cell[] = [];
  const { colCount, children } = table;

  let index = 0;
  for (let i = 0; i < children.length; i++) {
    const col = index % colCount;
    const row = Math.floor(index / colCount);
    cells[index++] = {
      row,
      col,
      content: children[i],
    };
  }

  return cells;
};

const getChildrenFromCells = (
  cells: readonly Cell[],
  colCount: number,
): t.CharTable['children'] => {
  const children: (t.CharRow | null)[] = [];

  for (const cell of cells) {
    const { row, col, content } = cell;
    const index = row * colCount + col;

    children[index] = content;
  }

  return children;
};

export const matrix = (state: State, action: Action): State => {
  if (action.type === 'InsertMatrix') {
    // TODO: implement this
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
  const cursorRow = Math.floor(cellIndex / matrix.colCount);
  const cursorCol = cellIndex % matrix.colCount;

  const matrixOffset = path[matrixPathIndex];
  const matrixParentPath = path.slice(0, matrixPathIndex);

  if (action.type === 'AddRow') {
    const cells = getCellsFromTable(matrix) as Mutable<Cell>[];

    if (action.side === 'above') {
      for (const cell of cells) {
        if (cell.row >= cursorRow) {
          cell.row++;
        }
      }
      for (let col = 0; col < matrix.colCount; col++) {
        cells.push({
          row: cursorRow,
          col: col,
          content: b.row([b.char('0')]),
        });
      }
    } else if (action.side === 'below') {
      for (const cell of cells) {
        if (cell.row > cursorRow) {
          cell.row++;
        }
      }
      for (let col = 0; col < matrix.colCount; col++) {
        cells.push({
          row: cursorRow + 1,
          col: col,
          content: b.row([b.char('0')]),
        });
      }
    }

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        const newMatrix = {
          ...matrix,
          children: getChildrenFromCells(cells, matrix.colCount),
          rowCount: matrix.rowCount + 1,
        };

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
    const cells = getCellsFromTable(matrix)
      // remove all cells in the current row
      .filter((cell) => cell.row !== cursorRow) as Mutable<Cell>[];

    for (const cell of cells) {
      if (cell.row > cursorRow) {
        cell.row--;
      }
    }

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        const newMatrix = {
          ...matrix,
          children: getChildrenFromCells(cells, matrix.colCount),
          rowCount: matrix.rowCount - 1,
        };

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
        // only move the cursor if its in the last row
        cursorRow === matrix.rowCount - 1
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
    const cells = getCellsFromTable(matrix) as Mutable<Cell>[];

    if (action.side === 'left') {
      for (const cell of cells) {
        if (cell.col >= cursorCol) {
          cell.col++;
        }
      }
      for (let row = 0; row < matrix.rowCount; row++) {
        cells.push({
          col: cursorCol,
          row: row,
          content: b.row([b.char('0')]),
        });
      }
    } else if (action.side === 'right') {
      for (const cell of cells) {
        if (cell.col > cursorCol) {
          cell.col++;
        }
      }
      for (let row = 0; row < matrix.rowCount; row++) {
        cells.push({
          col: cursorCol + 1,
          row: row,
          content: b.row([b.char('0')]),
        });
      }
    }

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        const newColCount = matrix.colCount + 1;
        const newMatrix = {
          ...matrix,
          children: getChildrenFromCells(cells, newColCount),
          colCount: newColCount,
        };

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
      ...focus,
      path: replaceElement(
        cellPathIndex,
        focus.path,
        action.side === 'left'
          ? cellIndex + cursorRow + 1
          : cellIndex + cursorRow,
      ),
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

  if (action.type === 'DeleteColumn') {
    const cells = getCellsFromTable(matrix).filter(
      (cell) => cell.col !== cursorCol,
    ) as Mutable<Cell>[];

    for (const cell of cells) {
      if (cell.col > cursorCol) {
        cell.col--;
      }
    }

    const newRoot = PathUtils.updateRowAtPath(
      state.row,
      matrixParentPath,
      (node) => {
        const newColCount = matrix.colCount - 1;
        const newMatrix = {
          ...matrix,
          children: getChildrenFromCells(cells, newColCount),
          colCount: newColCount,
        };

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
      ...focus,
      path:
        cursorCol === matrix.colCount - 1
          ? replaceElement(cellPathIndex, focus.path, cellIndex - cursorRow - 1)
          : replaceElement(cellPathIndex, focus.path, cellIndex - cursorRow),
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

  return state;
};
