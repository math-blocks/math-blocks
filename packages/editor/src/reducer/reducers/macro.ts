import * as b from '../../char/builders';
import * as t from '../../char/types';
import { isAccentType } from '../../shared-types';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const startMacro = (state: State): State => {
  // case to handle:
  // - pressing '\' should insert a new macro node and move
  //   the cursor into it
  // - what about pressing '\' inside an existing macro

  // other thoughts:
  // - it would be nice for insert-char to not know about how
  //   to complete a macro, should we introduce the idea of modes?
  // - there's also the case of shared logic across many reducers
  //   when inserting a new node that replaces the existing selection

  const { row, selection } = state;
  const newNode = b.macro([]);

  const { focus } = selection;
  const { start, end } = SelectionUtils.getPathAndRange(selection);

  const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
    const beforeSelection = node.children.slice(0, start);
    const afterSelection = node.children.slice(end);
    return {
      ...node,
      children: [...beforeSelection, newNode, ...afterSelection],
    };
  });

  if (newRow === row) {
    return state;
  }

  const newFocus = {
    path: [...focus.path, start, 0],
    offset: 0,
  };

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};

const isCharAtom = (node: t.CharNode): node is t.CharAtom => {
  return node.type === 'char';
};

export const completeMacro = (
  macros: Record<string, string>,
  state: State,
): State => {
  // bail if we've got something selected
  if (!SelectionUtils.isCollapsed(state.selection)) {
    return state;
  }

  const path = state.selection.focus.path;
  if (path.length > 1) {
    const parentPath = path.slice(0, -1);
    const parentNode = PathUtils.getNodeAtPath(state.row, parentPath);

    if (parentNode?.type === 'macro') {
      const grandparentPath = path.slice(0, -2);
      const grandparentNode = PathUtils.getNodeAtPath(
        state.row,
        grandparentPath,
      );

      if (grandparentNode && 'children' in grandparentNode) {
        const index = grandparentNode.children.findIndex(
          (node) => parentNode === node,
        );

        const macroString = parentNode.children[0].children
          .filter(isCharAtom)
          .map((node) => node.value)
          .join('');

        const macroValue = macros[macroString];

        if (!macroValue) {
          return state;
        }

        const newRow = PathUtils.updateRowAtPath(
          state.row,
          grandparentPath,
          (node) => {
            const newNode = isAccentType(macroString)
              ? b.accent([], macroString)
              : b.char(macroValue);
            const beforeMacro = node.children.slice(0, index);
            const afterMacro = node.children.slice(index + 1);
            return {
              ...node,
              children: [...beforeMacro, newNode, ...afterMacro],
            };
          },
        );

        if (newRow !== state.row) {
          const newFocus = isAccentType(macroString)
            ? {
                path: [...grandparentPath, index, 0],
                offset: 0,
              }
            : {
                path: grandparentPath,
                offset: index + 1,
              };

          return {
            ...state,
            row: newRow,
            selection: { anchor: newFocus, focus: newFocus },
          };
        }
      }
    }
  }

  return state;
};
