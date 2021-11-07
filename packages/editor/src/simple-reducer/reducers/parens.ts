import * as b from '../../char/builders';
import { CharDelimited } from '../../char/types';

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
  const { selection, row } = state;
  const { focus } = selection;

  if (!SelectionUtils.isCollapsed(selection)) {
    // Replaces the selection with a parens node.
    const { start, end } = SelectionUtils.getPathAndRange(selection);

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
    // If we're inside a delimited node with a pending paren and `char` matches
    // the pending paren, update the contents of the delimited and its parent and
    // set `pending: false` on the delimited.
    if (focus.path.length > 0) {
      const parentNode = PathUtils.getNodeAtPath(row, focus.path.slice(0, -1));
      if (parentNode?.type === 'delimited') {
        const grandparentPath = focus.path.slice(0, -2);
        const grandparentIndex = focus.path[focus.path.length - 2];
        if (parentNode.leftDelim.pending && leftGlyphMap[char] === char) {
          const newRow = PathUtils.updateRowAtPath(
            row,
            grandparentPath,
            (node) => {
              const inner = parentNode.children[0];
              const beforeLeftParen = inner.children.slice(0, focus.offset);
              const afterLeftParen = inner.children.slice(focus.offset);
              const newParens: CharDelimited = {
                ...parentNode,
                children: [b.row(afterLeftParen)],
                leftDelim: {
                  ...parentNode.leftDelim,
                  pending: false,
                },
              };
              return {
                ...node,
                children: [
                  ...beforeLeftParen,
                  newParens,
                  ...node.children.slice(1),
                ],
              };
            },
          );

          const newFocus = {
            path: [...grandparentPath, focus.offset, 0],
            offset: 0,
          };

          return {
            ...state,
            row: newRow,
            selection: { anchor: newFocus, focus: newFocus },
          };
        }
        if (parentNode.rightDelim.pending && rightGlyphMap[char] === char) {
          const newRow = PathUtils.updateRowAtPath(
            row,
            grandparentPath,
            (node) => {
              const inner = parentNode.children[0];
              const beforeRightParen = inner.children.slice(0, focus.offset);
              const afterRightParen = inner.children.slice(focus.offset);
              const newParens: CharDelimited = {
                ...parentNode,
                children: [b.row(beforeRightParen)],
                rightDelim: {
                  ...parentNode.rightDelim,
                  pending: false,
                },
              };
              return {
                ...node,
                children: [
                  ...node.children.slice(0, -1),
                  newParens,
                  ...afterRightParen,
                ],
              };
            },
          );

          const newFocus = {
            path: [...grandparentPath],
            offset: grandparentIndex + 1,
          };

          return {
            ...state,
            row: newRow,
            selection: { anchor: newFocus, focus: newFocus },
          };
        }
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
