import * as t from '../../../char/types';
import * as b from '../../../char/builders';
import * as u from '../../../char/util';

import type { VerticalWork, Column } from './types';
import * as PathUtils from '../../path-utils';

import type { State, Selection } from '../../types';
import { NodeType } from '../../../shared-types';

export const stateToVerticalWork = (state: State): VerticalWork | null => {
  const { row, selection } = state;

  const pathNodes = PathUtils.getNodesForPath(row, selection.focus.path);

  if (pathNodes.length < 1) {
    return null;
  }

  const tableNode = pathNodes[0];

  if (tableNode.type !== NodeType.Table || tableNode.subtype !== 'algebra') {
    return null;
  }

  const { rowCount, colCount, children } = tableNode;
  // The Table type says it can contain null cells, but right now this
  // never happens so we ignore this.
  const cells = children as t.CharRow[];

  const columns: Column[] = [];
  for (let i = 0; i < colCount; i++) {
    const col: t.CharRow[] = [];
    for (let j = 0; j < rowCount; j++) {
      const index = j * colCount + i;
      col.push(cells[index]);
    }
    columns.push(col); // this is unsafe
  }

  // 0 is the index of the table within the parent row
  // 1 is the index of the cell within the table
  const cursorCellIndex = selection.focus.path[1];
  const cursorCell = tableNode.children[cursorCellIndex];

  if (!cursorCell) {
    return null;
  }

  const cursorIndex = selection.focus.path[2];

  return {
    id: tableNode.id,
    type: tableNode.type,
    subtype: tableNode.subtype,
    style: tableNode.style,

    colStyles: tableNode.colStyles,
    rowStyles: tableNode.rowStyles,

    columns,
    colCount,
    rowCount,

    cursorId: cursorCell.id,
    cursorIndex: cursorIndex,
  };
};

export const verticalWorkToState = (work: VerticalWork): State => {
  const { columns, colCount, rowCount, cursorId } = work;

  const cells: t.CharRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    for (const col of columns) {
      cells.push(col[i]);
    }
  }

  const index = cells.findIndex((cell) => cell.id === cursorId);

  const table: t.CharTable = {
    id: work.id,
    type: NodeType.Table,
    subtype: 'algebra',
    rowCount: rowCount,
    colCount: colCount,
    rowStyles: work.rowStyles,
    style: {},
    children: cells,
  };

  const focus = {
    path: [0, index],
    offset: 0, // TODO: maintain cursor position within the cell
  };

  const selection: Selection = {
    anchor: focus,
    focus: focus,
  };

  const row: t.CharRow = b.row([table]);

  return {
    row,
    selection,
    selecting: false,
  };
};

export const isCellEmpty = (cell: t.CharRow | null): boolean =>
  !cell || cell.children.length === 0;
export const isColumnEmpty = (col: Column | null): boolean =>
  !col || col.every(isCellEmpty);

export const isCellPlusMinus = (cell: t.CharRow | null): boolean =>
  cell?.children.length === 1 && u.isAtom(cell.children[0], ['+', '\u2212']);

export const isCellEqualSign = (cell: t.CharRow | null): boolean =>
  cell?.children.length === 1 && u.isAtom(cell.children[0], '=');

export const isOperator = (cell: t.CharRow | null): boolean =>
  isCellPlusMinus(cell) || isCellEqualSign(cell);

export const isCellSkippable = (cell: t.CharRow | null): boolean =>
  cell?.children.length === 1 &&
  u.isAtom(cell.children[0], ['+', '\u2212', '=', '<', '>']);

export const isEmpty = (cell: t.CharRow | null): boolean =>
  (cell?.children?.length ?? 0) === 0;

export const getOtherCells = (
  col: Column,
  keepCell: t.CharRow,
): t.CharRow[] => {
  return col.filter((cell: t.CharRow) => cell !== keepCell);
};

export const createEmptyColumn = (rowCount: number): Column => {
  const emptyCol: t.CharRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    emptyCol.push(b.row([]));
  }
  return emptyCol;
};

export type CursorLoc = {
  readonly col: number;
  readonly row: number;
};

export const getCursorLoc = (work: VerticalWork): CursorLoc => {
  const { columns, cursorId, colCount, rowCount } = work;

  for (let col = 0; col < colCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      const cell = columns[col][row];
      if (cell.id === cursorId) {
        return { row, col };
      }
    }
  }

  throw new Error(`Couldn't find cell with id: ${cursorId}`);
};
