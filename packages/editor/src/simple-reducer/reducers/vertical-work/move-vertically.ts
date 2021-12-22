import { getId } from '@math-blocks/core';

import * as t from '../../../char/types';
import * as b from '../../../char/builders';
import { NodeType } from '../../../shared-types';

import * as PathUtils from '../../path-utils';
import type { State } from '../../types';

import { stateToVerticalWork, verticalWorkToState, getCursorLoc } from './util';
import { adjustColumns } from './adjust-columns';
import type { VerticalWork } from './types';

export const moveUp = (state: State): State => {
  const { row, selection } = state;

  const pathNodes = PathUtils.getNodesForPath(row, selection.focus.path);

  if (pathNodes.length < 1) {
    return state;
  }

  const tableNode = pathNodes[0];

  if (tableNode.type !== NodeType.Table || tableNode.subtype !== 'algebra') {
    // TODO: handle moving vertically between numerator/denominator and other stuff
    return state;
  }

  let work = stateToVerticalWork(state);
  if (!work) {
    return state;
  }

  const loc = getCursorLoc(work);

  if (loc.row > 0) {
    work = {
      ...work,
      cursorId: work.columns[loc.col][loc.row - 1].id,
    };
  }

  return verticalWorkToState(adjustColumns(work));
};

const createVerticalWorkTable = (state: State): VerticalWork | null => {
  const { row, selection } = state;

  const splitCells: (t.CharRow | null)[] = [];
  let prevChildren: t.CharNode[] = [];
  let prevChild: t.CharNode | null = null;

  let childIndex = 0;
  let cursorCellIndex = -1;
  for (const child of row.children) {
    // NOTE: This only handles if we move down when the cursor isn't inside
    // a complex node.
    if (childIndex === selection.focus.offset) {
      cursorCellIndex = splitCells.length;
    }
    if (child.type === 'char' && ['+', '\u2212'].includes(child.value)) {
      if (
        prevChild?.type !== 'char' ||
        !['+', '\u2212'].includes(prevChild.value)
      ) {
        if (prevChildren.length > 0) {
          splitCells.push(b.row(prevChildren));
          prevChildren = [];
        }
        splitCells.push(b.row([child]));
      } else {
        prevChildren.push(child);
      }
    } else if (child.type === 'char' && ['=', '>', '<'].includes(child.value)) {
      if (prevChildren.length > 0) {
        splitCells.push(b.row(prevChildren));
        prevChildren = [];
      }
      splitCells.push(b.row([child]));
    } else {
      prevChildren.push(child);
    }
    prevChild = child;
    childIndex++;
  }
  if (prevChildren.length > 0) {
    splitCells.push(b.row(prevChildren));
  }
  if (cursorCellIndex === -1) {
    cursorCellIndex = splitCells.length - 1;
  }

  const colCount = splitCells.length;

  const table: t.CharTable = {
    id: getId(),
    type: NodeType.Table,
    subtype: 'algebra',
    children: splitCells,
    rowCount: 1,
    colCount: colCount,
    style: {},
  };

  const newFocus = {
    path: [0, cursorCellIndex],
    // This places it at the start of the cell, but we could be more
    // precise about this.
    offset: 0,
  };

  const result = {
    ...state,
    row: b.row([table]),
    selection: { anchor: newFocus, focus: newFocus },
  };

  return stateToVerticalWork(result);
};

export const moveDown = (state: State): State => {
  const { row, selection } = state;

  const pathNodes = PathUtils.getNodesForPath(row, selection.focus.path);

  // NOTE: This doesn't handle pressing down from inside a fraction or
  // something like that to show work
  let work =
    pathNodes.length < 1
      ? createVerticalWorkTable(state)
      : stateToVerticalWork(state);

  console.log('work = ', work);

  if (!work) {
    return state;
  }

  const loc = getCursorLoc(work);

  // Adds a new row if possible
  if (loc.row === work.rowCount - 1 && work.rowCount < 3) {
    // TODO: use null if the previous row used null
    const columns = work.columns.map((col) => [...col, b.row([])]);
    console.log('new columns = ', columns);
    work = {
      ...work,
      columns: columns,
      rowCount: work.rowCount + 1,
    };
  }

  // Moves to the next row if possible
  if (loc.row < work.rowCount - 1) {
    work = {
      ...work,
      cursorId: work.columns[loc.col][loc.row + 1].id,
    };
  }

  return verticalWorkToState(adjustColumns(work));
};
