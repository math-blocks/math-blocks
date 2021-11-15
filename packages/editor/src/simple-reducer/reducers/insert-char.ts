import * as b from '../../char/builders';
import * as t from '../../char/types';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

const findLastIndex = <T>(
  array: readonly T[],
  start: number,
  predicate: (item: T) => boolean,
): number => {
  if (array.length === 0) {
    return -1;
  }

  let i = start;
  for (; i > -1; i--) {
    const item = array[i];
    if (predicate(item)) {
      return i;
    }
  }
  return i;
};

const macros: Record<string, string> = {
  // greek lowercase
  pi: '\u03C0',

  // operators
  // "in": "\u2208",
  notin: '\u2209',
  ni: '\u220B',
  niton: '\u220C',
  infty: '\u221E',
  int: '\u222B',
  iint: '\u222C',
  iiint: '\u222D',
  neq: '\u2260',
  leq: '\u2264',
  geq: '\u2265',
  lt: '<',
  gt: '>',
  // "sqrt": call out to the root reducer
  // "frac": call out to the frac reducer
};

const allAtoms = (nodes: readonly t.CharNode[]): nodes is t.CharAtom[] => {
  return nodes.every((node) => node.type === 'char');
};

export const insertChar = (state: State, char: string): State => {
  const { row, selection } = state;
  const newNode = b.char(char);

  const { focus } = selection;
  const { start, end } = SelectionUtils.getPathAndRange(selection);

  let newOffset = start + 1;

  const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
    // TODO: Create a separate reducer that creates a "compose character" node type
    // that has different styling that let's people see the whole composition before
    // accepting it.  This will also allow us to use macros with overlapping names,
    // e.g. \in and \int.
    const lastBackslashIndex = findLastIndex(
      node.children,
      start,
      (child) => child.type === 'char' && child.value === '\\',
    );
    if (lastBackslashIndex !== -1) {
      const slice = node.children.slice(lastBackslashIndex + 1, start);

      if (allAtoms(slice)) {
        const macro = slice.map((child) => child.value).join('') + char;
        if (macro in macros) {
          const beforeSelection = node.children.slice(0, lastBackslashIndex);
          const afterSelection = node.children.slice(end);
          newOffset = lastBackslashIndex + 1;
          return {
            ...node,
            children: [
              ...beforeSelection,
              b.char(macros[macro]),
              ...afterSelection,
            ],
          };
        }
      }
    }

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
    path: focus.path,
    offset: newOffset,
  };

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};
