import { getId } from '@math-blocks/core';

import * as t from '../../../char/types';
import * as b from '../../../char/builders';
import { NodeType } from '../../../shared-types';

import type { State } from '../../types';
import { stateToVerticalWork, verticalWorkToState } from './util';
import { adjustColumns } from './adjust-columns';

export const moveUp = (state: State): State => {
  return state;
};

// TODO: split this into multiple sub-functions
// - createTable
// - moveDown
export const moveDown = (state: State): State => {
  // TODO:
  // - if the cursor is in the root
  //   - then place the current row inside a table
  //   - add a row below it

  const { row } = state;

  // TODO:
  // - check if we're inside a 'table' of subtype 'algebra'
  // - if we are either create a third row or navigate into an existing row

  const splitRows: (t.CharRow | null)[] = [];
  let prevChildren: t.CharNode[] = [];
  let prevChild: t.CharNode | null = null;

  for (const child of row.children) {
    if (child.type === 'char' && ['+', '\u2212'].includes(child.value)) {
      if (
        prevChild?.type !== 'char' ||
        !['+', '\u2212'].includes(prevChild.value)
      ) {
        if (prevChildren.length > 0) {
          splitRows.push(b.row(prevChildren));
          prevChildren = [];
        }
        splitRows.push(b.row([child]));
      } else {
        prevChildren.push(child);
      }
    } else if (child.type === 'char' && ['=', '>', '<'].includes(child.value)) {
      if (prevChildren.length > 0) {
        splitRows.push(b.row(prevChildren));
        prevChildren = [];
      }
      splitRows.push(b.row([child]));
    } else {
      prevChildren.push(child);
    }
    prevChild = child;
  }
  if (prevChildren.length > 0) {
    splitRows.push(b.row(prevChildren));
  }

  const colCount = splitRows.length;

  for (let i = 0; i < colCount; i++) {
    if (splitRows[i] == null) {
      splitRows.push(null);
    } else {
      splitRows.push(b.row([]));
    }
  }

  const table: t.CharTable = {
    id: getId(),
    type: NodeType.Table,
    subtype: 'algebra',
    children: splitRows,
    rowCount: 2,
    colCount: colCount,
    style: {},
  };

  const newFocus = {
    path: [0, colCount],
    offset: 0,
  };

  const result = {
    ...state,
    row: b.row([table]),
    selection: { anchor: newFocus, focus: newFocus },
  };

  const work = stateToVerticalWork(result);
  console.log('work = ', work);
  if (!work) {
    return state;
  }

  const adjustedWork = adjustColumns(work);
  console.log('adjustedWork = ', adjustedWork);
  return verticalWorkToState(adjustedWork);
};
