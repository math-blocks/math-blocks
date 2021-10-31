import * as b from '../../char/builders';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

const leftGlyphMap = {
  '(': '(',
  ')': '(',
  '{': '{',
  '}': '{',
  '[': '[',
  ']': '[',
  '|': '|',
};

const rightGlyphMap = {
  '(': ')',
  ')': ')',
  '{': '}',
  '}': '}',
  '[': ']',
  ']': ']',
  '|': '|',
};

export const parens = (
  state: State,
  char: '(' | ')' | '[' | ']' | '{' | '}' | '|',
): State => {
  // wiggle your big toe
  // - replace everything to the right the current cursor location with a parens node
  const { selection, row } = state;
  const { focus } = selection;

  if (!SelectionUtils.isCollapsed(selection)) {
    // replace the selection with a parens node

    const { start, end } = SelectionUtils.getSelectionRange(selection);

    const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
      const beforeSelection = node.children.slice(0, start);
      const afterSelection = node.children.slice(end);
      const parens = b.delimited(
        node.children.slice(start, end),
        b.char(leftGlyphMap[char]),
        b.char(rightGlyphMap[char]),
      );
      return {
        ...node,
        children: [...beforeSelection, parens, ...afterSelection],
      };
    });

    if (newRow !== row) {
      const newFocus =
        leftGlyphMap[char] === char
          ? {
              path: [...focus.path, start, 0],
              offset: 0,
            }
          : {
              ...focus,
              offset: start + 1, // move the right of the parens
            };

      return {
        ...state,
        row: newRow,
        selection: { anchor: newFocus, focus: newFocus },
      };
    }
  }

  const focusRow = PathUtils.getNodeAtPath(row, focus.path);
  if (focusRow?.type === 'row') {
    // TODO: check if we're inside a 'delimited' node with a pending
    // parens matching the 'char' the user pressed.
    if (focus.path.length > 0) {
      const parentNode = PathUtils.getNodeAtPath(row, focus.path.slice(0, -1));
      if (parentNode?.type === 'delimited') {
        console.log('Inside delimited node');
        console.log(parentNode);
        if (parentNode.leftDelim.pending && leftGlyphMap[char] === char) {
          // mark the leftDelim as not pending
          // reposition the leftDelim so that it's immediately to the left
          // of where the cursor currently is
        }
        if (parentNode.rightDelim.pending && rightGlyphMap[char] === char) {
          // mark the rightDelim as not pending
          // reposition the rightDelim so that it's immediately to the right
          // of where the cursor currently is
        }

        // TODO: check if the parens matches the 'char' and is pending
        // if it is, set it to be not pending
        return state;
      }
    }

    const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
      const beforeSelection = node.children.slice(0, focus.offset);
      const afterSelection = node.children.slice(focus.offset);
      const parens = b.delimited(
        rightGlyphMap[char] === char ? beforeSelection : afterSelection,
        b.char(leftGlyphMap[char], rightGlyphMap[char] === char),
        b.char(rightGlyphMap[char], leftGlyphMap[char] === char),
      );
      return {
        ...node,
        children:
          rightGlyphMap[char] === char
            ? [parens, ...afterSelection]
            : [...beforeSelection, parens],
      };
    });

    if (newRow !== row) {
      const newFocus =
        leftGlyphMap[char] === char
          ? {
              path: [...focus.path, focus.offset, 0],
              offset: 0,
            }
          : {
              path: focus.path,
              offset: 1,
            };

      return {
        ...state,
        row: newRow,
        selection: { anchor: newFocus, focus: newFocus },
      };
    }
  }

  return state;
};
